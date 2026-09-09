const { Camoufox } = require("camoufox-js");

function normalizeLocation(location) {
    return location
        .trim()
        .toLowerCase()
        .replace(/\bbengaluru\b/g, "bangalore");
}

async function scrapeTutorJobs(subject, location) {
    let browser;
    const jobs = [];
    const seenUrls = new Set();

    try {
        console.log("Starting Camoufox...");

        browser = await Camoufox({
            headless: false
        });

        const page = await browser.newPage();

        const subjectSlug = subject
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");

        const baseUrl =
            `https://www.teacheron.com/${subjectSlug}-tutor-jobs`;

        for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
            const pageUrl =
                pageNumber === 1
                    ? baseUrl
                    : `${baseUrl}?page=${pageNumber}`;

            console.log(`Opening page ${pageNumber}: ${pageUrl}`);

            await page.goto(pageUrl, {
                waitUntil: "domcontentloaded",
                timeout: 30000
            });

            await page.waitForTimeout(2000);

            const jobLinks = await page.locator("a").evaluateAll((anchors) => {
                return anchors
                    .map((anchor) => ({
                        title: anchor.innerText.trim(),
                        url: anchor.href
                    }))
                    .filter((link) =>
                        link.url.includes("/teacher-job/")
                    );
            });

            const uniqueLinks = [
                ...new Map(
                    jobLinks.map((job) => [job.url, job])
                ).values()
            ];

            console.log(
                `Page ${pageNumber}: found ${uniqueLinks.length} jobs.`
            );

            if (uniqueLinks.length === 0) {
                break;
            }

            for (const jobLink of uniqueLinks) {
                if (seenUrls.has(jobLink.url)) {
                    continue;
                }

                seenUrls.add(jobLink.url);

                try {
                    console.log("Scraping:", jobLink.url);

                    await page.goto(jobLink.url, {
                        waitUntil: "domcontentloaded",
                        timeout: 30000
                    });

                    await page.waitForTimeout(1000);

                    const job = await page.evaluate(() => {
                        const lines = document.body.innerText
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean);

                        const title =
                            document.querySelector("h1")?.innerText?.trim() ||
                            "";

                        const titleIndex = lines.findIndex(
                            (line) => line === title
                        );

                        const detailsIndex = lines.findIndex((line) =>
                            /Posted\s*:/i.test(line)
                        );

                        const details =
                            detailsIndex !== -1
                                ? lines[detailsIndex]
                                : "";

                        const subjectCandidates =
                            titleIndex !== -1 && detailsIndex !== -1
                                ? lines.slice(
                                    titleIndex + 1,
                                    detailsIndex
                                )
                                : [];

                        const ignoredSubjectLines = [
                            "Find Tutors",
                            "Find Tutor Jobs",
                            "Assignment help",
                            "Request a tutor"
                        ];

                        const actualSubjects = subjectCandidates
                            .filter((line) => {
                                return (
                                    !line.startsWith("Contact ") &&
                                    !ignoredSubjectLines.includes(line)
                                );
                            })
                            .filter((line) => line.length > 1);

                        const beforePosted = details
                            .split(/Posted\s*:/i)[0]
                            .trim();

                        const currencyMatch = beforePosted.match(
                            /[₹$€£]/
                        );

                        let jobLocation = beforePosted;
                        let budget = "";

                        if (currencyMatch) {
                            const currencyIndex = currencyMatch.index;

                            jobLocation = beforePosted
                                .slice(0, currencyIndex)
                                .trim();

                            budget = beforePosted
                                .slice(currencyIndex)
                                .trim();
                        }

                        const postedMatch = details.match(
                            /Posted\s*:\s*(.*?)\s+Level\s*:/i
                        );

                        const levelMatch = details.match(
                            /Level\s*:\s*(.*?)\s+Requires\s*:/i
                        );

                        const descriptionStart =
                            detailsIndex !== -1
                                ? detailsIndex + 1
                                : 0;

                        const resourcesIndex = lines.findIndex(
                            (line, index) =>
                                index > descriptionStart &&
                                /^Resources$/i.test(line)
                        );

                        const descriptionEnd =
                            resourcesIndex !== -1
                                ? resourcesIndex
                                : lines.length;

                        const description = lines
                            .slice(descriptionStart, descriptionEnd)
                            .filter((line) => {
                                return (
                                    !line.startsWith("Contact ") &&
                                    !line.startsWith("Posted by ") &&
                                    !line.startsWith("Phone verified") &&
                                    !line.startsWith("Teacher's gender") &&
                                    !line.startsWith("Prefers tutors") &&
                                    !line.startsWith("Available online") &&
                                    !line.startsWith("Not available") &&
                                    !line.startsWith("Can not travel") &&
                                    !line.startsWith("Can communicate")
                                );
                            })
                            .join(" ")
                            .trim();

                        return {
                            title,
                            subjects: actualSubjects.join(", "),
                            location: jobLocation,
                            budget,
                            postedDate: postedMatch
                                ? postedMatch[1].trim()
                                : "",
                            level: levelMatch
                                ? levelMatch[1].trim()
                                : "",
                            description,
                            url: window.location.href
                        };
                    });

                    const requestedLocation =
                        normalizeLocation(location);

                    const jobLocation =
                        normalizeLocation(job.location);

                    const jobTitle =
                        job.title.toLowerCase();

                    const jobDescription =
                        job.description.toLowerCase();

                    let locationMatches = false;

                    if (requestedLocation === "online") {
                        locationMatches =
                            jobTitle.includes("online") ||
                            jobDescription.includes("mode: online") ||
                            jobDescription.includes("available online");
                    } else {
                        locationMatches =
                            jobLocation.includes(requestedLocation) ||
                            jobTitle.includes(requestedLocation) ||
                            jobDescription.includes(
                                `location: ${requestedLocation}`
                            );
                    }

                    if (!locationMatches) {
                        continue;
                    }

                    jobs.push({
                        title: job.title || jobLink.title,
                        subjects: job.subjects || subject,
                        location: job.location || location,
                        level: job.level,
                        budget: job.budget,
                        description: job.description,
                        postedDate: job.postedDate,
                        url: job.url,
                        scrapedAt: new Date().toISOString()
                    });

                } catch (error) {
                    console.error(
                        `Failed to scrape ${jobLink.url}:`,
                        error.message
                    );
                }
            }
        }

        console.log(
            `Total matching jobs scraped: ${jobs.length}`
        );

        return jobs;

    } catch (error) {
        console.error("Scraping failed:", error);

        throw error;

    } finally {
        if (browser) {
            await browser.close();
        }

        console.log("Camoufox closed.");
    }
}

module.exports = {
    scrapeTutorJobs
};

const searchButton = document.getElementById("searchButton");
const subjectInput = document.getElementById("subject");
const locationInput = document.getElementById("location");
const status = document.getElementById("status");
const jobsContainer = document.getElementById("jobsContainer");

searchButton.addEventListener("click", async () => {
    const subject = subjectInput.value.trim();
    const location = locationInput.value.trim();

    if (!subject || !location) {
        status.textContent = "Please enter both subject and location.";
        return;
    }

    searchButton.disabled = true;
    status.textContent = "Searching for tutor jobs...";
    jobsContainer.innerHTML = "";

    try {
        const result = await window.electronAPI.searchJobs(
            subject,
            location
        );

        if (!result.success) {
            status.textContent = result.message;
            return;
        }

        status.textContent = result.message;

        displayJobs(result.jobs);

    } catch (error) {
        console.error("Search error:", error);
        status.textContent = "An error occurred while searching.";
    } finally {
        searchButton.disabled = false;
    }
});

function displayJobs(jobs) {
    jobsContainer.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        jobsContainer.innerHTML = `
            <p>No tutor jobs found.</p>
        `;
        return;
    }

    jobs.forEach((job) => {
        const jobCard = document.createElement("article");
        jobCard.className = "job-card";

        jobCard.innerHTML = `
            <h2>${escapeHtml(job.title)}</h2>

            <p>
                <strong>Subjects:</strong>
                ${escapeHtml(job.subjects || "Not available")}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHtml(job.location || "Not available")}
            </p>

            <p>
                <strong>Level:</strong>
                ${escapeHtml(job.level || "Not available")}
            </p>

            <p>
                <strong>Budget:</strong>
                ${escapeHtml(job.budget || "Not available")}
            </p>

            <p>
                <strong>Posted:</strong>
                ${escapeHtml(job.posted_date || "Not available")}
            </p>

            <p class="description">
                ${escapeHtml(job.description || "No description available.")}
            </p>

            <button class="open-job-button">
                Open Job
            </button>
        `;

        const openButton = jobCard.querySelector(".open-job-button");

        openButton.addEventListener("click", () => {
            window.electronAPI.openJob(job.url);
        });

        jobsContainer.appendChild(jobCard);
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDirectory = path.join(__dirname, "../../data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "jobs.db");

const db = new Database(databasePath);

db.prepare(`
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        subjects TEXT,
        location TEXT,
        level TEXT,
        budget TEXT,
        description TEXT,
        posted_date TEXT,
        url TEXT UNIQUE,
        scraped_at TEXT
    )
`).run();

function insertJob(job) {
    const statement = db.prepare(`
        INSERT OR IGNORE INTO jobs (
            title,
            subjects,
            location,
            level,
            budget,
            description,
            posted_date,
            url,
            scraped_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    statement.run(
        job.title,
        job.subjects,
        job.location,
        job.level,
        job.budget,
        job.description,
        job.postedDate,
        job.url,
        job.scrapedAt
    );
}

function insertJobs(jobs) {
    const insertMany = db.transaction((jobs) => {
        for (const job of jobs) {
            insertJob(job);
        }
    });

    insertMany(jobs);
}

function getJobsBySearch(subject, location) {
    const searchSubject = subject.trim().toLowerCase();
    const searchLocation = location.trim().toLowerCase();

    let locationPattern = `%${searchLocation}%`;

    if (searchLocation === "bangalore") {
        locationPattern = "%bangal%";
    }

    return db.prepare(`
        SELECT *
        FROM jobs
        WHERE LOWER(subjects) LIKE ?
        AND LOWER(location) LIKE ?
        ORDER BY id DESC
    `).all(
        `%${searchSubject}%`,
        locationPattern
    );
}

function clearJobs() {
    db.prepare("DELETE FROM jobs").run();
}

module.exports = {
    insertJob,
    insertJobs,
    getJobsBySearch,
    clearJobs
};

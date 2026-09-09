# TeacherOn Tutor Job Scraper

A desktop application built with Electron, Node.js, Playwright, and Camoufox to search and collect publicly available tutor job requirements from TeacherOn.

## Features

- Search tutor jobs by subject and location
- Scrape the first 3 pages of TeacherOn tutor job listings
- Extract job title, subjects, location, level, budget, description, posted date, and job URL
- Store scraped jobs locally using SQLite
- Prevent duplicate jobs using the job URL
- Display results in the desktop application
- Open job listings in the system's default browser
- Handles missing fields and scraping errors gracefully
- Runs browser automation outside the renderer process

## Tech Stack

- Electron
- Node.js
- Vanilla HTML, CSS, JavaScript
- Playwright
- Camoufox
- SQLite
- better-sqlite3

## Project Structure

```text
teacheron-tutor-scraper/
│
├── src/
│   ├── main/
│   │   ├── main.js
│   │   ├── scraper.js
│   │   └── database.js
│   │
│   ├── preload/
│   │   └── preload.js
│   │
│   └── renderer/
│       ├── index.html
│       ├── style.css
│       └── renderer.js
│
├── data/
│   └── jobs.db
│
├── package.json
├── .gitignore
└── README.md

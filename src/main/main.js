const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

const database = require("./database");
const { scrapeTutorJobs } = require("./scraper");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(
        path.join(__dirname, "../renderer/index.html")
    );
}

ipcMain.handle("search-jobs", async (event, { subject, location }) => {
    console.log("Search request received:");
    console.log("Subject:", subject);
    console.log("Location:", location);

    try {
        const jobs = await scrapeTutorJobs(subject, location);

        database.insertJobs(jobs);

        const savedJobs = database.getJobsBySearch(
            subject,
            location
        );

        return {
            success: true,
            message: `Found ${savedJobs.length} jobs.`,
            jobs: savedJobs
        };

    } catch (error) {
        console.error("Search error:", error);

        return {
            success: false,
            message: "Failed to search for tutor jobs.",
            jobs: []
        };
    }
});

ipcMain.handle("open-job", async (event, url) => {
    try {
        await shell.openExternal(url);
    } catch (error) {
        console.error("Failed to open job:", error);
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

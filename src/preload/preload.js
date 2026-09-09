const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    searchJobs: (subject, location) => {
        return ipcRenderer.invoke("search-jobs", {
            subject,
            location
        });
    },

    openJob: (url) => {
        return ipcRenderer.invoke("open-job", url);
    }
});

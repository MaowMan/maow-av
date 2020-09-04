const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const puppeteer = require("puppeteer-electron");
const path = require("path");
const fetch = require("node-fetch");
const concatTypedArray = require("concat-typed-array");
const fs = require("fs");
const handbrake = require("handbrake-js");
const hidefile = require("hidefile");
require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "../node_modules", ".bin", "electron"),
    awaitWriteFinish: true,
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    mainWindow.setMenuBarVisibility(false);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../public/index.html"));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

const main = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const pages = await browser.pages();
    const [page] = pages;
    const mother = "https://this-page-intentionally-left-blank.org/";
    await page.setCacheEnabled(false);
    await page.goto(mother);
    let last_ts = null;
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        if (request.url().split("?")[0].split(".").reverse()[0] === "ts") {
            last_ts = request.url();
        }
        request.continue();
    });
    const main = createWindow();
    ipcMain.handle("get-token", async (event, arg) => {
        try {
            await page.goto(mother);
            last_ts = null;
            await page.goto(arg, { waitUntil: "networkidle0" });
            await page.$eval("div#av01_player", (node) => node.click());
            return last_ts;
        } catch (e) {
            return null;
        }
    });
    ipcMain.handle("get-video", async (event, arg) => {
        try {
            const video = await fetch(arg);
            if (video.status != 200) {
                return null;
            }
            const blob = await video.blob();
            const arrayBuffer = await blob.arrayBuffer();
            let uint8array = new Uint8Array(arrayBuffer);
            //console.log(int32array);
            return uint8array;
        } catch (e) {
            return null;
        }
    });
    ipcMain.handle("merge-video", async (event, arg) => {
        try {
            console.log("merging!");
            //console.log(arg);
            arg.sort((a, b) => a.seq - b.seq);
            //console.log("sorted");
            //console.log(arg);
            const videos = arg.map(element => element.video);
            //console.log(videos);
            const merged = concatTypedArray(Uint8Array, ...videos);
            //console.log(merged);
            return merged;
        } catch (e) {
            return null
        }
    })
    ipcMain.handle("save-video", async (event, path, data) => {
        try {
            if (data.length === 0) { return null }
            const bytes = new Uint8Array(Buffer.from(data));
            const stream = fs.createWriteStream(path, { flags: "a" });
            stream.write(bytes);
            stream.close();
            return 0;
        } catch (e) {
            return null
        }
    })
    ipcMain.handle("compress-video", async (event, cache_path, wanted_path) => {
        await to_mp4(cache_path, wanted_path);
        console.log("done!");
        return 0;
    })

    ipcMain.handle("get-local", async (event) => {
        return path.join(__dirname , "../cache.ts");
    })

    async function to_mp4(cache_path, wanted_path) {
        return new Promise(resolve => {
            handbrake.spawn({ input: cache_path, output: wanted_path})
                .on("complete", response => { resolve(response) })
                .on('progress', progress => {
                    console.log(`Percent complete: ${progress.percentComplete}, ETA: ${progress.eta}`);
                });
        })
    }

    ipcMain.handle("get-save-path", async (event) => {
        const file_path = dialog.showSaveDialogSync(main, {
            title: "儲存影片",
            filters: [
                { name: "Videos", extensions: ["mp4"] },
                { name: "All Files", extensions: ["*"] },
            ],
            defaultPath: 'av.mp4',
        });
        return file_path;
    })
    ipcMain.handle("delete-cache", async (event , cache_path) => {
        try{
            fs.unlinkSync(cache_path);
        }
        catch (e){

        }
        finally{
            return 0;
        }
    })

};

app.on("ready", () => main());

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

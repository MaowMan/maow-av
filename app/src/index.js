const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { firefox } = require("playwright");
const path = require("path");
const fetch = require("node-fetch");
const concatTypedArray = require("concat-typed-array");
const fs = require("fs");
const handbrake = require("handbrake-js");
const m3u8Parser = require('m3u8-parser');

const ffmpeg = createFFmpeg({ log: true });
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

if (!app.isPackaged) {
    require("electron-reload")(__dirname, {
        electron: path.join(__dirname, "../node_modules", ".bin", "electron"),
        awaitWriteFinish: true,
    });
}
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
    console.log("main");
    const main = createWindow();
    ipcMain.handle("get-token", async (event, url, mode) => {
        try {
            update_downloader("正在取得下載憑證...");
            const browser = await firefox.launch({
                headless: true,
                executablePath: path.join(__dirname, "../firefox-1144/firefox/firefox.exe")
            });
            const page = await browser.newPage();
            await page.route('**/*', (route) => {
                return route.request().resourceType() === 'media'
                    ? route.abort()
                    : route.continue()
            })
            await page.goto(url, { waitUntil: "domcontentloaded" });
            page.on('request', request =>
                console.log('>>', request.method(), request.url()));
            if (mode === 0) {
                const response = await page.waitForResponse(/^(?=.*index)(?=.*\.m3u8).*$/);
                const playlistParser = new m3u8Parser.Parser();
                const rawPlaylist = await response.text();
                const playlistlink = await response.url()
                playlistParser.push(rawPlaylist);
                playlistParser.end();
                const playlist = playlistParser.manifest;
                await browser.close();
                console.log(playlist);
                console.log(`playlist >> ${playlist.segments.length}`);
                return { link: playlistlink, playlist: playlist };
            }
            else if (mode === 1) {
                const previewRequest = await page.waitForRequest(/video\.m3u8/);
                const previewUrl = previewRequest.url();
                const playlistUrl = previewUrl.replace("preview/", "");
                console.log(playlistUrl);
                const getPlaylist = async url => {
                    const response = await fetch(url);
                    const playlistParser = new m3u8Parser.Parser();
                    const rawPlaylist = await response.text();
                    playlistParser.push(rawPlaylist);
                    playlistParser.end();
                    return playlistParser.manifest;
                };
                const getUpperlink = url => {
                    const seqment = url.split('/');
                    seqment.pop();
                    return seqment.join('/');
                }
                const getAudiolist = async playlist => {
                    const audios = playlist.mediaGroups.AUDIO[`${Object.keys(playlist.mediaGroups.AUDIO)[0]}`];
                    const firstaudio = audios[`${Object.keys(audios)[0]}`];
                    //console.log(firstaudio);
                    const audiolist = await getPlaylist(`${getUpperlink(playlistUrl)}/${firstaudio.uri}`);
                    return audiolist;
                }
                const masterPlaylist = await getPlaylist(playlistUrl);
                const playlist = await getPlaylist(`${getUpperlink(playlistUrl)}/${masterPlaylist.playlists[0].uri}`);
                const audiolist = await getAudiolist(masterPlaylist);
                //console.log(playlist);
                await browser.close();
                return { link: playlistUrl, playlist: playlist, audiolist: audiolist };
            }

        } catch (e) {
            console.log(e);
            return null;
        }
    });
    ipcMain.handle("get-video", async (event, resource_url, seq, type) => {
        try {
            update_downloader(`下載${type}中：${seq + 1}...`);
            const video = await fetch(resource_url);
            console.log(`downloading >> ${resource_url}`);
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
            update_downloader(`檔案緩存中...`);
            const bytes = new Uint8Array(Buffer.from(data));
            const stream = fs.createWriteStream(path, { flags: "a" });
            stream.write(bytes);
            stream.close();
            return 0;
        } catch (e) {
            return null
        }
    })
    ipcMain.handle("compress-video", async (event, cache_path, audio_path, wanted_path, mode) => {
        const mp3path = path.join(__dirname, `../asset/audio.mp3`);
        if (mode === 1) {
            const mp2path = path.join(__dirname, `../asset/audio.mp2`);
            fs.renameSync(audio_path, mp2path);
            await to_mp3(mp2path , mp3path);
            fs.renameSync(mp2path, audio_path);
        }
        await to_mp4(cache_path , wanted_path);
        if(mode === 1){
            await add_audio(mp3path , wanted_path);
            fs.unlinkSync(mp3path);
        }
        console.log("done!");
        return 0;
    })

    ipcMain.handle("get-local", async (event, filename) => {
        return path.join(__dirname, `../asset/${filename}`);
    })
    async function to_mp4(cache_path, wanted_path) {
        const opts = { input: cache_path, output: wanted_path }
        return new Promise(resolve => {
            handbrake.spawn(opts)
                .on("complete", response => { resolve(response) })
                .on('progress', progress => {
                    update_ratio(progress.percentComplete , 100);
                    update_downloader(`壓縮影片中，已完成${progress.percentComplete}% ETA:${progress.eta}`);
                });
        })
    }

    async function to_mp3(from_path , to_path){
        await ffmpeg.load();
        ffmpeg.setLogger(({ type, message }) => {
            update_downloader(`[${type}] ${message}`);
        });
        ffmpeg.setProgress((ratio)=>{
            update_ratio(ratio , 1);
        })
        ffmpeg.FS('writeFile', 'audio.mp2', await fetchFile(from_path));
        await ffmpeg.run('-i', 'audio.mp2', 'audio.mp3');
        await fs.promises.writeFile(to_path, ffmpeg.FS('readFile', 'audio.mp3'));
        return ;
    }

    async function

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
    ipcMain.handle("delete-cache", async (event, cache_path) => {
        try {
            fs.unlinkSync(cache_path);
        }
        catch (e) {

        }
        finally {
            return 0;
        }
    })

    async function update_downloader(message) {
        main.webContents.send("update-downloader", message);
    }
    async function update_ratio(process , whole) {
        main.webContents.send("update-ratio", process , whole);
    }

};

app.on("ready", () => {
    main();
});

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

<script>
  import { Input, Field, Switch, Tooltip, Button, Snackbar } from "svelma";
  import { element } from "svelte/internal";
  import Downloader from "./Downloader.svelte";
  const worker_limit = 5;
  let target = "";
  let downloading = false;
  async function main(url) {
    try {
      downloading = true;
      const token = await get_token(url);
      console.log(token);
      //await get_video(token);
      let counter = 1;
      const cache_path = await get_cache_path();
      await delete_cache(cache_path);
      //let minute = 0;
      while (true) {
        const workers = [];
        const cache = [];
        for (const worker of [...Array(worker_limit).keys()]) {
          workers.push(get_video(token, counter, cache));
          counter += 1;
        }
        await Promise.all(workers);
        //console.log(cache);
        if (cache[0].video === null) {
          break;
        }
        const merged = await merge_video(cache);
        await save_video(cache_path, merged);
      }
      //console.log(videos);
      if (counter > worker_limit * 2) {
        const wanted_path = await get_save_path();
        await compress_video(cache_path, wanted_path);
      }
      console.log("done!");
      await delete_cache(cache_path);
    } catch (e) {
      Snackbar.create({ message: `錯誤訊息：${e}` });
    } finally {
      Snackbar.create({ message: '下載完成'})
      downloading = false;
    }
  }
  async function get_cache_path() {
    const path = await window.ipcRenderer.invoke("get-local");
    return path;
  }
  async function get_token(url) {
    const token = await window.ipcRenderer.invoke("get-token", `${url}`);
    return token;
  }
  async function get_video(url, seq, cache) {
    const template = url.split("-");
    for (let ptr = 0; ptr < template.length; ptr++) {
      if(/^[0-9]*$/.test(template[ptr])){
        template[ptr] = `${seq}`
      }
    }
    const result = template.join("-");
    console.log(result);
    const video = await window.ipcRenderer.invoke(
      "get-video",
      `${result}`,
      seq
    );
    console.log(`${seq} completed`);
    cache.push({ seq: seq, video: video });
    return 0;
  }
  async function merge_video(videos) {
    const video = await window.ipcRenderer.invoke("merge-video", videos);
    return video;
  }
  async function get_save_path() {
    const path = await window.ipcRenderer.invoke("get-save-path");
    return path;
  }
  async function save_video(path, data) {
    await window.ipcRenderer.invoke("save-video", path, data);
    return 0;
  }
  async function compress_video(cache_path, wanted_path) {
    await window.ipcRenderer.invoke("compress-video", cache_path, wanted_path);
    return 0;
  }
  async function delete_cache(cache_path) {
    await window.ipcRenderer.invoke("delete-cache", cache_path);
    return 0;
  }
</script>

<section class="section">
  <div class="columns is-centered">
    <div class="column is-half">
      <Field label="輸入影片網址(支援av01.tv、pornhub)：">
        <Input type="text" icon="video" bind:value={target} />
      </Field>
      <Downloader bind:is_downloading={downloading} />
      {#if downloading}
        <Button disabled type="is-primary" iconPack="fas" iconLeft="heart">
          開始下載
        </Button>
      {:else}
        <Button
          type="is-primary"
          iconPack="fas"
          iconLeft="heart"
          on:click={() => main(target)}>
          開始下載
        </Button>
      {/if}
    </div>
  </div>
</section>

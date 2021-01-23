<script>
  export let is_downloading;
  import { Progress } from "svelma";
  let message = null;
  let ratio = 1;
  let max = 100;
  window.ipcRenderer.on("update-downloader", async (event, ipc_message) => {
    try {
      message = ipc_message;
    } catch (e) {
      message = null;
    }
  });
  window.ipcRenderer.on("update-ratio", async (event, process , whole) => {
    try {
      ratio = process;
      max = whole
    } catch (e) {
      message = null;
    }
  });
</script>

{#if is_downloading}
  <Progress type="is-link" value={ratio}  max ={`${max}`} />
  {#if message != null}
    <h6 class="subtitle is-6">{message}</h6>
  {/if}
{/if}

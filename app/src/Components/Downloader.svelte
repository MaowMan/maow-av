<script>
  export let is_downloading;
  import { Progress } from "svelma";
  let message = null;
  window.ipcRenderer.on("update-downloader", async (event, ipc_message) => {
    try {
      message = ipc_message;
    } catch (e) {
      message = null;
    }
  });
</script>

{#if is_downloading}
  <Progress type="is-link" />
  {#if message != null}
    <h6 class="subtitle is-6">{message}</h6>
  {/if}
{/if}

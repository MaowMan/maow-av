<script>
  import { Input, Field, Switch, Tooltip, Button } from "svelma";
  const { ipcRenderer } = require("electron");
  let target = "";
  async function get_token(url) {
    const token = await ipcRenderer.invoke("get-token", `${url}`);
    console.log(token);
  }
</script>

<section class="section">
  <div class="columns is-centered">
    <div class="column is-half">
      <Field label="輸入影片網址：">
        <Input type="text" icon="video" bind:value={target} />
      </Field>
      <Button
        type="is-primary"
        iconPack="fas"
        iconLeft="heart"
        on:click={() => get_token(target)}>
        開始下載
      </Button>
      <Field />
    </div>
  </div>
</section>

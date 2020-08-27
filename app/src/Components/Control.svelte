<script>
  import { Input, Field, Switch, Tooltip, Button } from "svelma";
  const sync = {
    target: ""
  };
</script>

<section class="section">
  <div class="columns is-centered">
    <div class="column is-half">
      <Field label="輸入影片網址：">
        <Input type="text" icon="video" bind:value={sync.target} />
      </Field>
      <Button type="is-primary" iconPack="fas" iconLeft="heart">
        開始下載
      </Button>
      <Field />
    </div>
  </div>
</section>

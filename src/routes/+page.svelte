<script lang="ts">
  import GooseRenderer from "$lib/components/GooseRenderer.svelte";
</script>

<svelte:head>
  <title>Goose Overlay</title>
</svelte:head>

<main class="overlay-shell">
  <GooseRenderer />
</main>

<style>
  :global(html, body) {
    --goose-overlay-width: 100vw;
    --goose-overlay-height: 100vh;

    margin: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
  }

  .overlay-shell {
    position: fixed;
    inset: 0;
    width: var(--goose-overlay-width);
    height: var(--goose-overlay-height);
    background: transparent;
    pointer-events: none;
  }
</style>

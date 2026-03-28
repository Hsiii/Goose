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
    margin: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
  }

  .overlay-shell {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    pointer-events: none;
  }
</style>

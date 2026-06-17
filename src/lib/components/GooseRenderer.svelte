<script lang="ts">
  import { onMount } from "svelte";
  import { Application, Assets, AnimatedSprite } from "pixi.js";
  import {
    createInitialGooseMotion,
    reconcileGooseMotionBounds,
    tickGooseMotion,
  } from "$lib/goose/motion";
  import {
    buildGooseAnimations,
    GOOSE_ATLAS_URL,
    GOOSE_RENDERING,
    type GooseAnimationSet,
  } from "$lib/goose/animationManifest";
  import type { GooseMotionBounds } from "$lib/types";

  let host: HTMLDivElement;

  function measureBounds(): GooseMotionBounds {
    const width = Math.max(
      host.clientWidth,
      GOOSE_RENDERING.minimumViewportWidth,
    );
    const height = Math.max(
      host.clientHeight,
      GOOSE_RENDERING.minimumViewportHeight,
    );

    return {
      width,
      height,
      floorY: height - GOOSE_RENDERING.floorOffset,
    };
  }

  onMount(() => {
    const app = new Application({
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: host,
    });

    host.appendChild(app.view as HTMLCanvasElement);

    let actor: AnimatedSprite | null = null;
    let bounds = measureBounds();
    let motion = createInitialGooseMotion(bounds);
    let previousState = motion.state;
    let animations: GooseAnimationSet | null = null;

    Assets.load(GOOSE_ATLAS_URL).then((sheet) => {
      animations = buildGooseAnimations(sheet);
      actor = new AnimatedSprite(animations.idle);
      actor.anchor.set(0.5, 1);
      actor.scale.set(GOOSE_RENDERING.spriteScale);
      actor.animationSpeed = GOOSE_RENDERING.animationSpeed.idle;
      actor.play();

      app.stage.addChild(actor);
    });

    const resizeObserver = new ResizeObserver(() => {
      bounds = measureBounds();
      motion = reconcileGooseMotionBounds(motion, bounds);
    });

    resizeObserver.observe(host);

    const animate = (): void => {
      motion = tickGooseMotion(motion, app.ticker.deltaMS, bounds);

      if (actor) {
        actor.position.set(motion.x, motion.y);
        // Correct facing direction
        actor.scale.x =
          Math.abs(GOOSE_RENDERING.spriteScale) * motion.direction;

        // State transition
        if (animations && previousState !== motion.state) {
          previousState = motion.state;
          const targetTextures = animations[motion.state];

          if (actor.textures !== targetTextures) {
            actor.textures = targetTextures;
            actor.animationSpeed = GOOSE_RENDERING.animationSpeed[motion.state];
            actor.gotoAndPlay(0);
          }
        }
      }
    };

    app.ticker.add(animate);

    return () => {
      resizeObserver.disconnect();
      app.ticker.remove(animate);
      app.destroy(true, true);
    };
  });
</script>

<div class="renderer-shell">
  <div bind:this={host} class="renderer-host"></div>
</div>

<style>
  .renderer-shell {
    position: absolute;
    inset: 0;
  }

  .renderer-host {
    position: absolute;
    inset: 0;
  }

  .renderer-host :global(canvas) {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }
</style>

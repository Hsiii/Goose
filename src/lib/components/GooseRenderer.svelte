<script lang="ts">
  import { onMount } from "svelte";
  import { Application, Assets, AnimatedSprite, Container } from "pixi.js";
  import {
    createInitialGooseMotion,
    reconcileGooseMotionBounds,
    tickGooseMotion,
  } from "$lib/engine/gooseMotion";
  import type { GooseMotionBounds, GooseMotionSnapshot } from "$lib/types";

  let host: HTMLDivElement;

  function measureBounds(): GooseMotionBounds {
    const width = Math.max(host.clientWidth, 220);
    const height = Math.max(host.clientHeight, 180);

    return {
      width,
      height,
      floorY: height - 120, // Adjusted due to taller standard sprite size
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

    // Group sprites loosely based on extraction mapping
    let animations: Record<string, any[]> = {};

    Assets.load("/assets/goose_spritesheet.json").then((sheet) => {
      // Create animations mapping based on the loaded sheet
      animations["walk"] = [
        sheet.textures["goose_walk_0"],
        sheet.textures["goose_walk_1"],
        sheet.textures["goose_walk_2"],
        sheet.textures["goose_walk_3"],
      ];
      animations["idle"] = [
        sheet.textures["goose_actions_0"],
        sheet.textures["goose_actions_1"],
        sheet.textures["goose_actions_2"],
        sheet.textures["goose_actions_3"],
      ];
      animations["inspect"] = [
        sheet.textures["goose_actions_4"],
        sheet.textures["goose_actions_5"],
        sheet.textures["goose_actions_6"],
        sheet.textures["goose_actions_7"],
      ];

      actor = new AnimatedSprite(animations["idle"]);
      actor.anchor.set(0.5, 1);
      actor.scale.set(0.6); // Tune down scale slightly as AI assets are often chunky
      actor.animationSpeed = 0.08;
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
        actor.scale.x = Math.abs(actor.scale.x) * motion.direction;

        // State transition
        if (previousState !== motion.state) {
          previousState = motion.state;
          const targetTextures = animations[motion.state] || animations["idle"];

          if (actor.textures !== targetTextures) {
            actor.textures = targetTextures;
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

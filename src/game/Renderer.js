/**
 * Renderer - Draws PNG layers and sprites to the Canvas each frame.
 *
 * Rendering pipeline per frame:
 *   1. Clear canvas
 *   2. Draw background PNG layers (Grass → Truck, indices 0-6) offset by camera
 *   3. Draw entities (Player, Follower, NPCs) sorted by y-position
 *   4. Draw foreground PNG layers (Wall, Wall_Decor, Roof, indices 7-9) offset by camera
 *   5. Draw floating prompts ("Talk" above NPCs, "Enter" above doors)
 */
import { CONFIG } from './Config.js';

/**
 * Layer stacking order from bottom to top.
 * Indices 0-6 are background layers drawn behind entities.
 * Indices 7-9 are foreground layers drawn in front of entities.
 */
const LAYER_ORDER = CONFIG.png.layerOrder;

/** Index of the last background layer (inclusive). */
const BG_LAST_INDEX = 6;

/** Index of the first foreground layer (inclusive). */
const FG_FIRST_INDEX = 7;

export class Renderer {
  /**
   * Layer stacking order from bottom to top.
   */
  static LAYER_ORDER = LAYER_ORDER;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    /** @type {Map<string, HTMLImageElement>} Loaded images keyed by layer name */
    this.layerImages = new Map();
  }

  /**
   * Load PNG layer images for a level.
   *
   * Uses the naming convention `png/Level_{N}__{LayerName}.png` where N is
   * the level number extracted from the levelId (e.g. "Level_1" → "1").
   * Also tries loading `png/Level_{N}_bg.png` as a background layer.
   * Missing images are skipped gracefully (logged and continued).
   *
   * @param {string} levelId - e.g. "Level_1"
   * @param {string[]} layerNames - Layer names to load
   */
  async loadLevelImages(levelId, layerNames) {
    // Clear previously loaded images
    this.layerImages.clear();

    // Extract the level number from the levelId (e.g. "Level_1" → "1")
    const levelNumber = levelId.replace(/^Level_/, '');
    const basePath = CONFIG.png.basePath;

    /**
     * Helper: attempt to load a single image. Resolves to the Image on
     * success or null on failure (missing file, network error, etc.).
     */
    const tryLoadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Renderer: could not load image "${src}" — skipping.`);
          resolve(null);
        };
        img.src = src;
      });
    };

    // Build the list of images to load in parallel
    const loadTasks = [];

    // Try loading the background composite image
    loadTasks.push({
      name: '_bg',
      src: `${basePath}/Level_${levelNumber}_bg.png`
    });

    // Load each named layer
    const namesToLoad = layerNames && layerNames.length > 0 ? layerNames : LAYER_ORDER;
    for (const layerName of namesToLoad) {
      loadTasks.push({
        name: layerName,
        src: `${basePath}/Level_${levelNumber}__${layerName}.png`
      });
    }

    // Fire all loads in parallel
    const results = await Promise.all(
      loadTasks.map(async (task) => {
        const img = await tryLoadImage(task.src);
        return { name: task.name, img };
      })
    );

    // Store successfully loaded images
    for (const { name, img } of results) {
      if (img) {
        this.layerImages.set(name, img);
      }
    }
  }

  /**
   * Render a full frame.
   *
   * @param {import('./Camera.js').Camera} camera
   * @param {object} level - Parsed level data (pxWid, pxHei, etc.)
   * @param {object} entities - { player, follower, npcs, doors }
   */
  render(camera, level, entities) {
    const ctx = this.ctx;

    // 1. Clear canvas
    this.clear();

    // 2. Draw background PNG layers (Grass → Truck, indices 0-6)
    this.drawLayers(camera, this.layerImages, 0, BG_LAST_INDEX);

    // 3. Draw entities sorted by y-position
    const allEntities = [];
    if (entities.player) allEntities.push(entities.player);
    if (entities.follower) allEntities.push(entities.follower);
    if (entities.npcs) {
      for (const npc of entities.npcs) {
        allEntities.push(npc);
      }
    }

    // Sort by y so entities lower on screen are drawn on top
    allEntities.sort((a, b) => a.y - b.y);

    for (const entity of allEntities) {
      this.drawEntity(camera, entity);
    }

    // 4. Draw foreground PNG layers (Wall, Wall_Decor, Roof, indices 7-9)
    this.drawLayers(camera, this.layerImages, FG_FIRST_INDEX, LAYER_ORDER.length - 1);

    // 5. Draw floating prompts
    this._drawPrompts(camera, entities);
  }

  /**
   * Draw a subset of loaded PNG layers offset by camera position.
   *
   * Iterates LAYER_ORDER from startIndex to endIndex (inclusive) and draws
   * each layer image that has been loaded, offset by the camera position.
   *
   * @param {import('./Camera.js').Camera} camera
   * @param {Map<string, HTMLImageElement>} layers - Loaded layer images
   * @param {number} startIndex - First LAYER_ORDER index to draw (inclusive)
   * @param {number} endIndex - Last LAYER_ORDER index to draw (inclusive)
   */
  drawLayers(camera, layers, startIndex, endIndex) {
    const ctx = this.ctx;

    // Draw the _bg composite if it exists and we're starting from the bottom
    if (startIndex === 0 && layers.has('_bg')) {
      const bgImg = layers.get('_bg');
      ctx.drawImage(bgImg, -camera.x, -camera.y);
    }

    for (let i = startIndex; i <= endIndex; i++) {
      const layerName = LAYER_ORDER[i];
      if (!layers.has(layerName)) continue;

      const img = layers.get(layerName);
      ctx.drawImage(img, -camera.x, -camera.y);
    }
  }

  /**
   * Draw a single entity sprite.
   * Delegates to entity.draw(ctx, camera) if the entity has a draw method.
   *
   * @param {import('./Camera.js').Camera} camera
   * @param {object} entity
   */
  drawEntity(camera, entity) {
    if (typeof entity.draw === 'function') {
      entity.draw(this.ctx, camera);
    }
  }

  /**
   * Clear the canvas.
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Fill with a dark background so we can tell the game loop is running
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Draw floating prompts above NPCs and doors that are in range.
   *
   * - "Talk" above NPCs with showPrompt === true
   * - "Enter" above doors that are within interaction range of the player
   *
   * @param {import('./Camera.js').Camera} camera
   * @param {object} entities - { player, follower, npcs, doors }
   * @private
   */
  _drawPrompts(camera, entities) {
    const ctx = this.ctx;

    // Draw "Talk" prompts above NPCs
    if (entities.npcs) {
      for (const npc of entities.npcs) {
        if (npc.showPrompt) {
          const screen = camera.worldToScreen(
            npc.x + npc.width / 2,
            npc.y
          );
          this._drawBadge(ctx, 'Talk', screen.x, screen.y - 14);
        }
      }
    }

    // Draw "Enter" prompts above doors in range of the player
    if (entities.doors && entities.player) {
      const player = entities.player;
      const range = CONFIG.interaction.range;

      for (const door of entities.doors) {
        const doorCenterX = door.x + door.width / 2;
        const doorCenterY = door.y + door.height / 2;
        const dx = player.x - doorCenterX;
        const dy = player.y - doorCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= range) {
          const screen = camera.worldToScreen(
            door.x + door.width / 2,
            door.y
          );
          this._drawBadge(ctx, 'Enter', screen.x, screen.y - 14);
        }
      }
    }
  }

  /**
   * Draw a small rounded-rect badge with centered text.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text - Badge label
   * @param {number} cx - Center X on screen
   * @param {number} cy - Center Y on screen (bottom edge of badge)
   * @private
   */
  _drawBadge(ctx, text, cx, cy) {
    ctx.save();

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 4;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const badgeWidth = textWidth + padding * 2;
    const badgeHeight = 14;
    const radius = 4;

    const x = cx - badgeWidth / 2;
    const y = cy - badgeHeight;

    // Rounded rectangle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + badgeWidth - radius, y);
    ctx.arcTo(x + badgeWidth, y, x + badgeWidth, y + radius, radius);
    ctx.lineTo(x + badgeWidth, y + badgeHeight - radius);
    ctx.arcTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - radius, y + badgeHeight, radius);
    ctx.lineTo(x + radius, y + badgeHeight);
    ctx.arcTo(x, y + badgeHeight, x, y + badgeHeight - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, y + badgeHeight / 2);

    ctx.restore();
  }
}

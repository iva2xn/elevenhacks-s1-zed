/**
 * Player - Player character with movement, collision, and animation.
 *
 * Loads individual PNG frames per direction (not a sprite sheet).
 * Movement is checked per-axis against the collision grid so the player can
 * slide along walls. The sprite is drawn centered on the collision bounding box.
 */
import { CONFIG } from './Config.js';

export class Player {
  /**
   * @param {number} x - Initial X position in world pixels
   * @param {number} y - Initial Y position in world pixels
   * @param {object} spriteConfig - Sprite configuration
   */
  constructor(x, y, spriteConfig) {
    // Position (top-left of collision bounding box)
    this.x = x;
    this.y = y;

    // Collision bounding box (smaller than sprite for tight collision)
    this.width = spriteConfig?.collisionWidth || 14;
    this.height = spriteConfig?.collisionHeight || 14;

    // Sprite frame dimensions
    this.frameWidth = spriteConfig?.frameWidth || 32;
    this.frameHeight = spriteConfig?.frameHeight || 32;

    // Movement
    this.direction = 'down';
    this.isMoving = false;
    this.speed = CONFIG.player.speed;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    this.frameCount = spriteConfig?.frameCount || 4;
    this.animSpeed = spriteConfig?.animSpeed || 0.15;

    // Individual frame images: { down: [img1..4], up: [img1..4], ... }
    this.frames = { down: [], up: [], left: [], right: [] };
    // Idle images: { down: img, up: img, ... }
    this.idleFrames = { down: null, up: null, left: null, right: null };
    this.spritesLoaded = false;
    this._loadingCount = 0;
    this._totalToLoad = 0;

    this._loadFrames(spriteConfig?.basePath || 'character-movement', spriteConfig?.prefix || 'lud');
  }

  /**
   * Load all individual frame PNGs.
   * Pattern: {basePath}/{prefix}-{direction}-{1-4}.png
   * Idle:    {basePath}/{prefix}-idle-{direction}.png
   * @private
   */
  _loadFrames(basePath, prefix) {
    const directions = ['down', 'up', 'left', 'right'];
    this._totalToLoad = directions.length * this.frameCount + directions.length; // walk + idle

    for (const dir of directions) {
      // Walk frames 1-4
      for (let i = 1; i <= this.frameCount; i++) {
        const img = new Image();
        img.onload = () => this._onFrameLoaded();
        img.onerror = () => {
          console.warn(`Player: missing frame ${basePath}/${prefix}-${dir}-${i}.png`);
          this._onFrameLoaded();
        };
        img.src = `${basePath}/${prefix}-${dir}-${i}.png`;
        this.frames[dir].push(img);
      }

      // Idle frame
      const idleImg = new Image();
      idleImg.onload = () => this._onFrameLoaded();
      idleImg.onerror = () => {
        console.warn(`Player: missing idle frame ${basePath}/${prefix}-idle-${dir}.png`);
        this._onFrameLoaded();
      };
      idleImg.src = `${basePath}/${prefix}-idle-${dir}.png`;
      this.idleFrames[dir] = idleImg;
    }
  }

  /** @private */
  _onFrameLoaded() {
    this._loadingCount++;
    if (this._loadingCount >= this._totalToLoad) {
      this.spritesLoaded = true;
    }
  }

  /**
   * Update player position and animation.
   * @param {number} dt - Delta time in seconds
   * @param {{ dx: number, dy: number, interact: boolean }} input
   * @param {import('./Collision.js').Collision} collision
   * @param {Array} [npcs] - NPC array for entity collision
   */
  update(dt, input, collision, npcs) {
    const { dx, dy } = input;

    const newX = this.x + dx * this.speed * dt;
    const newY = this.y + dy * this.speed * dt;

    if (dx !== 0 && collision.canMove(newX, this.y, this.width, this.height) && !this._hitsNPC(newX, this.y, npcs)) {
      this.x = newX;
    }
    if (dy !== 0 && collision.canMove(this.x, newY, this.width, this.height) && !this._hitsNPC(this.x, newY, npcs)) {
      this.y = newY;
    }

    // Update facing direction
    if (dy > 0) this.direction = 'down';
    else if (dy < 0) this.direction = 'up';
    else if (dx < 0) this.direction = 'left';
    else if (dx > 0) this.direction = 'right';

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer -= this.animSpeed;
        this.animFrame = (this.animFrame + 1) % this.frameCount;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * Draw the player sprite centered on the collision bounding box.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./Camera.js').Camera} camera
   */
  draw(ctx, camera) {
    // Center of the collision box in world coords
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Screen position: center the sprite frame on the collision center
    const screen = camera.worldToScreen(
      centerX - this.frameWidth / 2,
      centerY - this.frameHeight / 2
    );

    // Pick the right frame
    let img = null;
    if (this.isMoving) {
      const dirFrames = this.frames[this.direction];
      if (dirFrames && dirFrames[this.animFrame]) {
        img = dirFrames[this.animFrame];
      }
    } else {
      img = this.idleFrames[this.direction];
    }

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, screen.x, screen.y, this.frameWidth, this.frameHeight);
    } else {
      // Placeholder
      const boxScreen = camera.worldToScreen(this.x, this.y);
      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(boxScreen.x, boxScreen.y, this.width, this.height);
    }
  }

  /**
   * Check if the player AABB at (x, y) overlaps any NPC bounding box.
   * @param {number} x
   * @param {number} y
   * @param {Array} [npcs]
   * @returns {boolean}
   * @private
   */
  _hitsNPC(x, y, npcs) {
    if (!npcs) return false;
    for (const npc of npcs) {
      if (
        x < npc.x + npc.width &&
        x + this.width > npc.x &&
        y < npc.y + npc.height &&
        y + this.height > npc.y
      ) {
        return true;
      }
    }
    return false;
  }
}

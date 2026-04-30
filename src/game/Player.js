/**
 * Player - Player character with movement, collision, and animation.
 *
 * Uses a sprite sheet with rows for each direction and columns for animation frames.
 * Movement is checked per-axis against the collision grid so the player can
 * slide along walls.
 */
import { CONFIG } from './Config.js';

export class Player {
  /**
   * @param {number} x - Initial X position in world pixels
   * @param {number} y - Initial Y position in world pixels
   * @param {object} spriteConfig - Sprite sheet configuration
   * @param {string} spriteConfig.imageSrc - Path to the sprite sheet image
   * @param {number} spriteConfig.frameWidth - Width of one frame in pixels
   * @param {number} spriteConfig.frameHeight - Height of one frame in pixels
   * @param {number} spriteConfig.frameCount - Number of frames per direction
   * @param {Object} spriteConfig.animRowMap - Maps direction string to sprite row index
   * @param {number} spriteConfig.animSpeed - Seconds per animation frame
   */
  constructor(x, y, spriteConfig) {
    // Position
    this.x = x;
    this.y = y;

    // Sprite dimensions used as bounding box
    this.frameWidth = spriteConfig?.frameWidth || 16;
    this.frameHeight = spriteConfig?.frameHeight || 16;
    this.width = this.frameWidth;
    this.height = this.frameHeight;

    // Movement
    this.direction = 'down';
    this.isMoving = false;
    this.speed = CONFIG.player.speed;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    this.frameCount = spriteConfig?.frameCount || 4;
    this.animRowMap = spriteConfig?.animRowMap || { down: 0, left: 1, right: 2, up: 3 };
    this.animSpeed = spriteConfig?.animSpeed || 0.15;

    // Sprite sheet
    this.spriteSheet = null;
    this.spriteLoaded = false;
    this._loadSprite(spriteConfig?.imageSrc);
  }

  /**
   * Load the sprite sheet image asynchronously.
   * @param {string|undefined} imageSrc - Path to the sprite sheet
   * @private
   */
  _loadSprite(imageSrc) {
    if (!imageSrc) {
      return;
    }
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.src = imageSrc;
  }

  /**
   * Update player position and animation.
   *
   * Movement is resolved per-axis so the player can slide along walls:
   *   1. Try moving on X axis — accept if collision allows it
   *   2. Try moving on Y axis — accept if collision allows it
   *
   * Direction and animation state are updated based on input.
   *
   * @param {number} dt - Delta time in seconds
   * @param {{ dx: number, dy: number, interact: boolean }} input - Polled input state
   * @param {import('./Collision.js').Collision} collision - Collision system
   */
  update(dt, input, collision) {
    const { dx, dy } = input;

    // Compute candidate positions per axis
    const newX = this.x + dx * this.speed * dt;
    const newY = this.y + dy * this.speed * dt;

    // Resolve X axis independently
    if (dx !== 0 && collision.canMove(newX, this.y, this.width, this.height)) {
      this.x = newX;
    }

    // Resolve Y axis independently
    if (dy !== 0 && collision.canMove(this.x, newY, this.width, this.height)) {
      this.y = newY;
    }

    // Update facing direction based on input
    if (dy > 0) {
      this.direction = 'down';
    } else if (dy < 0) {
      this.direction = 'up';
    } else if (dx < 0) {
      this.direction = 'left';
    } else if (dx > 0) {
      this.direction = 'right';
    }

    // Determine if the player is moving this frame
    this.isMoving = dx !== 0 || dy !== 0;

    // Advance animation when moving, reset when idle
    if (this.isMoving) {
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer -= this.animSpeed;
        this.animFrame = (this.animFrame + 1) % this.frameCount;
      }
    } else {
      // Idle: show frame 0 of current direction
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * Draw the player sprite at the camera-adjusted screen position.
   *
   * If the sprite sheet hasn't loaded yet, draws a colored rectangle as a
   * placeholder so the player is always visible.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {import('./Camera.js').Camera} camera - Camera for coordinate conversion
   */
  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);

    if (this.spriteLoaded && this.spriteSheet) {
      // Determine source rectangle on the sprite sheet
      const row = this.animRowMap[this.direction] ?? 0;
      const srcX = this.animFrame * this.frameWidth;
      const srcY = row * this.frameHeight;

      ctx.drawImage(
        this.spriteSheet,
        srcX, srcY, this.frameWidth, this.frameHeight,
        screen.x, screen.y, this.frameWidth, this.frameHeight
      );
    } else {
      // Placeholder rectangle while sprite is loading or missing
      ctx.fillStyle = '#4a90d9';
      ctx.fillRect(screen.x, screen.y, this.width, this.height);
    }
  }
}

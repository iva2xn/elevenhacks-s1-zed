/**
 * Follower - Companion character (Michael) that trails the player with a
 * position-history delay.
 *
 * Each frame the player moves, the player's position is pushed into a history
 * buffer. Once the buffer exceeds `followDelay` entries the oldest position is
 * shifted off and used as the follower's target, creating a natural trailing
 * effect. Direction is derived from the position delta so the follower faces
 * the way it is walking.
 *
 * Uses the same sprite-sheet layout as Player: rows per direction, 4 frames
 * per direction, with a placeholder rectangle when the sprite hasn't loaded.
 */
import { CONFIG } from './Config.js';

export class Follower {
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

    // Movement state
    this.direction = 'down';
    this.isMoving = false;

    // Position-history trailing
    this.positionHistory = [];
    this.followDelay = CONFIG.follower?.followDelay ?? 10;

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
   * Update follower position based on the player's movement history.
   *
   * When the player is moving the current player position is recorded. Once
   * enough history has accumulated the follower pops the oldest entry and
   * moves there, creating a trailing effect. Direction is computed from the
   * position delta between the follower's previous and new position.
   *
   * When the player is idle the follower stops in place and shows its idle
   * animation frame.
   *
   * @param {number} dt - Delta time in seconds
   * @param {number} playerX - Current player X position
   * @param {number} playerY - Current player Y position
   * @param {boolean} isPlayerMoving - Whether the player moved this frame
   */
  update(dt, playerX, playerY, isPlayerMoving) {
    if (isPlayerMoving) {
      // Record the player's current position into the history buffer
      this.positionHistory.push({ x: playerX, y: playerY });

      // When enough history has built up, consume the oldest entry
      if (this.positionHistory.length > this.followDelay) {
        const oldPos = this.positionHistory.shift();

        // Compute direction from position delta
        const dx = oldPos.x - this.x;
        const dy = oldPos.y - this.y;

        if (Math.abs(dy) > Math.abs(dx)) {
          this.direction = dy > 0 ? 'down' : 'up';
        } else if (dx !== 0) {
          this.direction = dx > 0 ? 'right' : 'left';
        }

        // Move to the oldest recorded position
        this.x = oldPos.x;
        this.y = oldPos.y;
        this.isMoving = true;
      }

      // Advance walking animation
      if (this.isMoving) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
          this.animTimer -= this.animSpeed;
          this.animFrame = (this.animFrame + 1) % this.frameCount;
        }
      }
    } else {
      // Player is idle — stop at current position and show idle frame
      this.isMoving = false;
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * Draw the follower sprite at the camera-adjusted screen position.
   *
   * If the sprite sheet hasn't loaded yet, draws a colored rectangle as a
   * placeholder so the follower is always visible.
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
      ctx.fillStyle = '#d94a4a';
      ctx.fillRect(screen.x, screen.y, this.width, this.height);
    }
  }

  /**
   * Record a position to the history buffer.
   * @param {number} x
   * @param {number} y
   */
  recordPosition(x, y) {
    this.positionHistory.push({ x, y });
  }
}

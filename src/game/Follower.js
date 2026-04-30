/**
 * Follower - Companion character (Michael) that trails the player.
 *
 * Loads individual PNG frames per direction (same pattern as Player).
 * Sprite is drawn centered on the collision bounding box.
 */
import { CONFIG } from './Config.js';

export class Follower {
  /**
   * @param {number} x - Initial X position in world pixels
   * @param {number} y - Initial Y position in world pixels
   * @param {object} spriteConfig - Sprite configuration
   */
  constructor(x, y, spriteConfig) {
    this.x = x;
    this.y = y;

    this.width = spriteConfig?.collisionWidth || 14;
    this.height = spriteConfig?.collisionHeight || 14;
    this.frameWidth = spriteConfig?.frameWidth || 32;
    this.frameHeight = spriteConfig?.frameHeight || 32;

    this.direction = 'down';
    this.isMoving = false;

    this.positionHistory = [];
    this.followDelay = CONFIG.follower?.followDelay ?? 15;

    this.animFrame = 0;
    this.animTimer = 0;
    this.frameCount = spriteConfig?.frameCount || 4;
    this.animSpeed = spriteConfig?.animSpeed || 0.15;

    // Individual frame images
    this.frames = { down: [], up: [], left: [], right: [] };
    this.idleFrames = { down: null, up: null, left: null, right: null };
    this.spritesLoaded = false;
    this._loadingCount = 0;
    this._totalToLoad = 0;

    this._loadFrames(spriteConfig?.basePath || 'character-movement', spriteConfig?.prefix || 'michael');
  }

  /** @private */
  _loadFrames(basePath, prefix) {
    const directions = ['down', 'up', 'left', 'right'];
    this._totalToLoad = directions.length * this.frameCount + directions.length;

    for (const dir of directions) {
      for (let i = 1; i <= this.frameCount; i++) {
        const img = new Image();
        img.onload = () => this._onFrameLoaded();
        img.onerror = () => {
          console.warn(`Follower: missing frame ${basePath}/${prefix}-${dir}-${i}.png`);
          this._onFrameLoaded();
        };
        img.src = `${basePath}/${prefix}-${dir}-${i}.png`;
        this.frames[dir].push(img);
      }

      const idleImg = new Image();
      idleImg.onload = () => this._onFrameLoaded();
      idleImg.onerror = () => {
        console.warn(`Follower: missing idle frame ${basePath}/${prefix}-idle-${dir}.png`);
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
   * Update follower position from player's movement history.
   * @param {number} dt
   * @param {number} playerX
   * @param {number} playerY
   * @param {boolean} isPlayerMoving
   */
  update(dt, playerX, playerY, isPlayerMoving) {
    if (isPlayerMoving) {
      this.positionHistory.push({ x: playerX, y: playerY });

      if (this.positionHistory.length > this.followDelay) {
        const oldPos = this.positionHistory.shift();

        const dx = oldPos.x - this.x;
        const dy = oldPos.y - this.y;

        if (Math.abs(dy) > Math.abs(dx)) {
          this.direction = dy > 0 ? 'down' : 'up';
        } else if (dx !== 0) {
          this.direction = dx > 0 ? 'right' : 'left';
        }

        this.x = oldPos.x;
        this.y = oldPos.y;
        this.isMoving = true;
      }

      if (this.isMoving) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
          this.animTimer -= this.animSpeed;
          this.animFrame = (this.animFrame + 1) % this.frameCount;
        }
      }
    } else {
      this.isMoving = false;
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  /**
   * Draw the follower sprite centered on the collision bounding box.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./Camera.js').Camera} camera
   */
  draw(ctx, camera) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    const screen = camera.worldToScreen(
      centerX - this.frameWidth / 2,
      centerY - this.frameHeight / 2
    );

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
      const boxScreen = camera.worldToScreen(this.x, this.y);
      ctx.fillStyle = '#d94a4a';
      ctx.fillRect(boxScreen.x, boxScreen.y, this.width, this.height);
    }
  }

  recordPosition(x, y) {
    this.positionHistory.push({ x, y });
  }
}

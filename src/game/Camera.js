/**
 * Camera - Viewport that follows the player and provides coordinate conversion.
 *
 * State properties:
 *   x, y     - Top-left corner of the viewport in world coordinates
 *   width    - Viewport width in pixels
 *   height   - Viewport height in pixels
 */
export class Camera {
  /**
   * @param {number} viewportWidth  - Width of the viewport in pixels
   * @param {number} viewportHeight - Height of the viewport in pixels
   */
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  /**
   * Center the camera on a target position.
   * Sets x and y so the target is in the middle of the viewport.
   * @param {number} targetX - Target world X position
   * @param {number} targetY - Target world Y position
   */
  follow(targetX, targetY) {
    this.x = targetX - this.width / 2;
    this.y = targetY - this.height / 2;
  }

  /**
   * Clamp camera to level boundaries so it never shows outside the map.
   * Must be called after follow() to constrain the viewport.
   * @param {number} levelWidth  - Total level width in pixels
   * @param {number} levelHeight - Total level height in pixels
   */
  clamp(levelWidth, levelHeight) {
    // Clamp x to [0, levelWidth - viewportWidth]
    const maxX = levelWidth - this.width;
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
    }

    // Clamp y to [0, levelHeight - viewportHeight]
    const maxY = levelHeight - this.height;
    if (this.y < 0) {
      this.y = 0;
    } else if (this.y > maxY) {
      this.y = maxY;
    }
  }

  /**
   * Convert world coordinates to screen coordinates.
   * @param {number} worldX - X position in world space
   * @param {number} worldY - Y position in world space
   * @returns {{ x: number, y: number }} Screen-space position
   */
  worldToScreen(worldX, worldY) {
    return { x: worldX - this.x, y: worldY - this.y };
  }

  /**
   * Check if a world-space rectangle is visible in the viewport (frustum culling).
   * Returns true if the rectangle overlaps the camera viewport.
   * @param {number} worldX - Left edge of the rectangle in world space
   * @param {number} worldY - Top edge of the rectangle in world space
   * @param {number} width  - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @returns {boolean} True if any part of the rectangle is within the viewport
   */
  isVisible(worldX, worldY, width, height) {
    return (
      worldX + width > this.x &&
      worldX < this.x + this.width &&
      worldY + height > this.y &&
      worldY < this.y + this.height
    );
  }
}

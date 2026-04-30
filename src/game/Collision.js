/**
 * Collision - Grid-based collision detection using IntGrid data.
 *
 * IntGrid values:
 *   0 = empty/walkable
 *   1 = solid collision (walls, barriers, buildings)
 *   2 = danger/road hazard
 *   3 = interaction zone
 *
 * The collision grid is a 2D array indexed as [row][col].
 */
export class Collision {
  constructor() {
    this.grid = null;
    this.gridSize = 16;
    this.gridCols = 0;
    this.gridRows = 0;
  }

  /**
   * Load collision grid data.
   * @param {number[][]} grid - 2D array [row][col] of IntGrid values
   * @param {number} gridSize - Cell size in pixels
   * @param {number} gridCols
   * @param {number} gridRows
   */
  setGrid(grid, gridSize, gridCols, gridRows) {
    this.grid = grid;
    this.gridSize = gridSize;
    this.gridCols = gridCols;
    this.gridRows = gridRows;
  }

  /**
   * Convert pixel coordinates to grid coordinates.
   * @param {number} worldX - X position in pixels
   * @param {number} worldY - Y position in pixels
   * @returns {{ col: number, row: number }}
   */
  worldToGrid(worldX, worldY) {
    return {
      col: Math.floor(worldX / this.gridSize),
      row: Math.floor(worldY / this.gridSize)
    };
  }

  /**
   * Check if grid coordinates are within bounds.
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  isInBounds(col, row) {
    return col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows;
  }

  /**
   * Get the IntGrid value at a grid cell.
   * @param {number} col
   * @param {number} row
   * @returns {number} The cell value, or -1 if out of bounds
   */
  getCellValue(col, row) {
    if (!this.isInBounds(col, row)) {
      return -1;
    }
    return this.grid[row][col];
  }

  /**
   * Check if an AABB can occupy a position.
   * Checks all grid cells overlapped by the entity bounding box.
   * Returns false if any cell is value 1 (solid) or out of bounds.
   * Returns true if all cells are 0 (walkable), 2 (danger), or 3 (interaction).
   *
   * @param {number} x - Left edge of the bounding box in pixels
   * @param {number} y - Top edge of the bounding box in pixels
   * @param {number} width - Width of the bounding box in pixels
   * @param {number} height - Height of the bounding box in pixels
   * @returns {boolean}
   */
  canMove(x, y, width, height) {
    if (!this.grid) {
      return true;
    }

    // Compute the grid cell range the AABB overlaps.
    // Use width - 1 and height - 1 so an entity exactly aligned to a cell
    // boundary doesn't spill into the next cell.
    const startCol = Math.floor(x / this.gridSize);
    const startRow = Math.floor(y / this.gridSize);
    const endCol = Math.floor((x + width - 1) / this.gridSize);
    const endRow = Math.floor((y + height - 1) / this.gridSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (!this.isInBounds(col, row)) {
          return false;
        }
        const value = this.grid[row][col];
        if (value === 1) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if a position is in a danger zone (IntGrid value 2).
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @returns {boolean}
   */
  isDangerZone(x, y) {
    const { col, row } = this.worldToGrid(x, y);
    return this.getCellValue(col, row) === 2;
  }
}

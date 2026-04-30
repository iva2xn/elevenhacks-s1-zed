/**
 * LDtkLoader - Parses .ldtkl JSON files and extracts structured level data.
 *
 * Each .ldtkl file is an individual level file containing:
 * - identifier, pxWid, pxHei at the top level
 * - layerInstances[] with __identifier, __type, __cWid, __cHei, __gridSize
 * - IntGrid layers contain intGridCsv (flat array)
 * - Entity layers contain entityInstances[]
 * - Tile layers contain gridTiles[]
 */
export class LDtkLoader {
  constructor() {
    /** @type {Map<string, object>} Parsed levels keyed by identifier */
    this.levels = new Map();
  }

  /**
   * Fetch and parse an LDtk level file (.ldtkl).
   * @param {string} url - Path to the .ldtkl file
   * @returns {Promise<object>} The parsed level data
   */
  async loadLevel(url) {
    let json;
    try {
      const response = await fetch(url);
      const text = await response.text();
      json = JSON.parse(text);
    } catch (err) {
      const message = `LDtkLoader: Failed to load or parse level file "${url}": ${err.message}`;
      console.error(message);
      throw new Error(message);
    }

    const layerInstances = json.layerInstances || [];

    // Find the Collision IntGrid layer
    const collisionLayer = layerInstances.find(
      (l) => l.__type === 'IntGrid' && l.__identifier === 'Collision'
    );

    // Derive grid dimensions from the collision layer (or first available layer)
    const refLayer = collisionLayer || layerInstances[0];
    const gridSize = refLayer ? refLayer.__gridSize : 16;
    const gridCols = refLayer ? refLayer.__cWid : Math.floor(json.pxWid / gridSize);
    const gridRows = refLayer ? refLayer.__cHei : Math.floor(json.pxHei / gridSize);

    // Parse collision grid
    const collisionGrid = collisionLayer
      ? this._parseIntGrid(collisionLayer)
      : [];

    // Collect all entities from entity layers
    const entityLayers = layerInstances.filter((l) => l.__type === 'Entities');
    const entities = entityLayers.flatMap((l) => this._parseEntities(l));

    // Parse tile layers
    const tileLayers = this._parseTileLayers(layerInstances);

    const parsedLevel = {
      identifier: json.identifier,
      pxWid: json.pxWid,
      pxHei: json.pxHei,
      gridSize,
      gridCols,
      gridRows,
      collisionGrid,
      entities,
      tileLayers,
    };

    this.levels.set(json.identifier, parsedLevel);
    return parsedLevel;
  }

  /**
   * Retrieve a parsed level by identifier.
   * @param {string} levelId
   * @returns {object|undefined}
   */
  getLevel(levelId) {
    return this.levels.get(levelId);
  }

  /**
   * Parse an IntGrid layer's flat intGridCsv into a 2D [row][col] array.
   * @param {object} layerInstance - An LDtk layer instance with __type "IntGrid"
   * @returns {number[][]} 2D array indexed as [row][col]
   */
  _parseIntGrid(layerInstance) {
    const csv = layerInstance.intGridCsv || [];
    const cols = layerInstance.__cWid;
    const rows = layerInstance.__cHei;
    const grid = [];

    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        rowData.push(index < csv.length ? csv[index] : 0);
      }
      grid.push(rowData);
    }

    return grid;
  }

  /**
   * Parse entity instances from an entity layer.
   * Extracts identifier, px position, width, height, and converts
   * fieldInstances into a flat fields object.
   * @param {object} layerInstance - An LDtk layer instance with __type "Entities"
   * @returns {object[]} Array of parsed entity objects
   */
  _parseEntities(layerInstance) {
    const entityInstances = layerInstance.entityInstances || [];

    return entityInstances.map((entity) => {
      // Convert fieldInstances array into a flat key-value object
      const fields = {};
      if (entity.fieldInstances) {
        for (const field of entity.fieldInstances) {
          fields[field.__identifier] = field.__value;
        }
      }

      return {
        identifier: entity.__identifier,
        px: entity.px,
        width: entity.width,
        height: entity.height,
        fields,
      };
    });
  }

  /**
   * Parse tile layers from layer instances.
   * Extracts metadata and tile data for each Tiles-type layer.
   * @param {object[]} layerInstances - All layer instances from the level
   * @returns {object[]} Array of tile layer objects with identifier, gridSize, tilesetRelPath, and tiles
   */
  _parseTileLayers(layerInstances) {
    return layerInstances
      .filter((l) => l.__type === 'Tiles')
      .map((layer) => ({
        identifier: layer.__identifier,
        gridSize: layer.__gridSize,
        tilesetRelPath: layer.__tilesetRelPath,
        opacity: layer.__opacity,
        pxOffsetX: layer.pxOffsetX,
        pxOffsetY: layer.pxOffsetY,
        tiles: (layer.gridTiles || []).map((tile) => ({
          px: tile.px,
          src: tile.src,
          flip: tile.f,
          tileId: tile.t,
          data: tile.d,
          alpha: tile.a,
        })),
      }));
  }
}

/**
 * EntityManager - Creates and manages game entities from LDtk data.
 *
 * Responsible for spawning Player, Follower, NPCs, and LevelTransition objects
 * from parsed LDtk entity data, and providing update/query methods for the
 * game loop.
 */
import { Player } from './Player.js';
import { Follower } from './Follower.js';
import { NPC, NPC_CONFIGS } from './NPC.js';
import { CONFIG } from './Config.js';

/** Set of LDtk identifiers that map to NPC instances. */
const NPC_IDENTIFIERS = new Set(['Motorcycle_Rider', 'Motorcycle_Rider_2', 'TimeWaste']);

/** Set of LDtk identifiers that map to LevelTransition objects. */
const DOOR_IDENTIFIERS = new Set(['Door', 'LevelExit']);

export class EntityManager {
  constructor() {
    /** @type {Player|null} */
    this.player = null;
    /** @type {Follower|null} */
    this.follower = null;
    /** @type {NPC[]} */
    this.npcs = [];
    /** @type {Array<{x: number, y: number, width: number, height: number, targetLevel: string, targetSpawn: string}>} */
    this.doors = [];
  }

  /**
   * Create entities from parsed level data.
   *
   * Iterates the entity list from the parsed LDtk level and creates the
   * appropriate game objects:
   * - PlayerStart → sets the Player spawn position
   * - Motorcycle_Rider / Motorcycle_Rider_2 / TimeWaste → NPC instances
   * - Door / LevelExit → LevelTransition objects
   *
   * If no PlayerStart entity is found, the Player spawns at (0, 0) with a
   * console warning.
   *
   * A Follower (Michael) is always created 16px below the player spawn.
   *
   * @param {object} parsedLevel - Parsed level from LDtkLoader
   * @param {import('./Collision.js').Collision} collision - Collision system (stored for player updates)
   */
  spawnFromLevel(parsedLevel, collision) {
    // Store collision reference for player updates
    this.collision = collision;

    // Reset collections
    this.player = null;
    this.follower = null;
    this.npcs = [];
    this.doors = [];

    let playerSpawnX = null;
    let playerSpawnY = null;

    const entities = parsedLevel.entities || [];

    for (const entity of entities) {
      const id = entity.identifier;
      const x = entity.px[0];
      const y = entity.px[1];

      if (id === 'PlayerStart' || id === 'Player') {
        playerSpawnX = x;
        playerSpawnY = y;
      } else if (NPC_IDENTIFIERS.has(id)) {
        const config = NPC_CONFIGS[id] || {};
        const npc = new NPC(id, x, y, entity.width, entity.height, config);
        this.npcs.push(npc);
      } else if (DOOR_IDENTIFIERS.has(id)) {
        const fields = entity.fields || {};
        this.doors.push({
          x,
          y,
          width: entity.width,
          height: entity.height,
          targetLevel: fields.targetLevel || '',
          targetSpawn: fields.targetSpawn || ''
        });
      }
    }

    // Spawn player — fall back to a walkable area if no PlayerStart entity
    if (playerSpawnX === null || playerSpawnY === null) {
      console.warn('No PlayerStart entity found in level — spawning player at default walkable position (160, 240)');
      playerSpawnX = 160;
      playerSpawnY = 240;
    }

    this.player = new Player(playerSpawnX, playerSpawnY, CONFIG.player.spriteConfig);

    // Spawn follower (Michael) to the left of the player spawn
    this.follower = new Follower(playerSpawnX - 20, playerSpawnY, CONFIG.follower.spriteConfig);
  }

  /**
   * Update all managed entities for one frame.
   *
   * - Player is updated with input and collision
   * - Follower trails the player using position history
   *
   * @param {number} dt - Delta time in seconds
   * @param {{ dx: number, dy: number, interact: boolean }} input - Polled input
   * @param {{ x: number, y: number }} playerPos - Current player position (unused — player updates itself)
   */
  update(dt, input, playerPos) {
    if (this.player && this.collision) {
      this.player.update(dt, input, this.collision, this.npcs);
    }

    if (this.follower && this.player) {
      this.follower.update(dt, this.player.x, this.player.y, this.player.isMoving);
    }
  }

  /**
   * Return all NPCs and doors within range of the given position.
   *
   * NPCs use their built-in isInRange method (center-to-center distance).
   * Doors use a simple center-to-center distance check.
   *
   * @param {number} x - Query X position in world pixels
   * @param {number} y - Query Y position in world pixels
   * @param {number} range - Range in pixels
   * @returns {Array<NPC|{x: number, y: number, width: number, height: number, targetLevel: string, targetSpawn: string}>}
   */
  getEntitiesInRange(x, y, range) {
    const result = [];

    for (const npc of this.npcs) {
      if (npc.isInRange(x, y, range)) {
        result.push(npc);
      }
    }

    for (const door of this.doors) {
      const doorCenterX = door.x + door.width / 2;
      const doorCenterY = door.y + door.height / 2;
      const dx = x - doorCenterX;
      const dy = y - doorCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= range) {
        result.push(door);
      }
    }

    return result;
  }

  /**
   * Remove all entities for level transitions.
   * Resets every collection so the next level can be spawned cleanly.
   */
  clear() {
    this.player = null;
    this.follower = null;
    this.npcs = [];
    this.doors = [];
    this.collision = null;
  }
}

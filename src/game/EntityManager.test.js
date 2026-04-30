import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityManager } from './EntityManager.js';
import { NPC_CONFIGS } from './NPC.js';

/**
 * Minimal collision stub that always allows movement.
 */
function makeCollision() {
  return {
    canMove: () => true,
    isDangerZone: () => false
  };
}

/**
 * Build a minimal parsed level with the given entity list.
 */
function makeLevel(entities = []) {
  return {
    identifier: 'Level_1',
    pxWid: 672,
    pxHei: 320,
    gridSize: 16,
    gridCols: 42,
    gridRows: 20,
    collisionGrid: [],
    entities
  };
}

/**
 * Helper to create an entity object matching the LDtk parsed format.
 */
function entity(identifier, x, y, width = 16, height = 16, fields = {}) {
  return { identifier, px: [x, y], width, height, fields };
}

describe('EntityManager', () => {
  let em;
  let collision;

  beforeEach(() => {
    em = new EntityManager();
    collision = makeCollision();
  });

  describe('constructor', () => {
    it('initializes with empty collections', () => {
      expect(em.player).toBeNull();
      expect(em.follower).toBeNull();
      expect(em.npcs).toEqual([]);
      expect(em.doors).toEqual([]);
    });
  });

  describe('spawnFromLevel', () => {
    it('creates Player at PlayerStart position', () => {
      const level = makeLevel([entity('PlayerStart', 100, 200)]);
      em.spawnFromLevel(level, collision);

      expect(em.player).not.toBeNull();
      expect(em.player.x).toBe(100);
      expect(em.player.y).toBe(200);
    });

    it('creates Follower 16px below player spawn', () => {
      const level = makeLevel([entity('PlayerStart', 100, 200)]);
      em.spawnFromLevel(level, collision);

      expect(em.follower).not.toBeNull();
      expect(em.follower.x).toBe(100);
      expect(em.follower.y).toBe(216);
    });

    it('spawns Player at (0, 0) and warns when no PlayerStart', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const level = makeLevel([entity('Motorcycle_Rider', 50, 50)]);
      em.spawnFromLevel(level, collision);

      expect(em.player.x).toBe(0);
      expect(em.player.y).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No PlayerStart')
      );
      warnSpy.mockRestore();
    });

    it('creates NPCs from known NPC identifiers', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 100, 50, 96, 16),
        entity('Motorcycle_Rider_2', 200, 80, 96, 16),
        entity('TimeWaste', 300, 120, 16, 16)
      ]);
      em.spawnFromLevel(level, collision);

      expect(em.npcs).toHaveLength(3);
      expect(em.npcs[0].identifier).toBe('Motorcycle_Rider');
      expect(em.npcs[0].x).toBe(100);
      expect(em.npcs[0].y).toBe(50);
      expect(em.npcs[0].width).toBe(96);
      expect(em.npcs[1].identifier).toBe('Motorcycle_Rider_2');
      expect(em.npcs[2].identifier).toBe('TimeWaste');
    });

    it('assigns NPC_CONFIGS to NPCs', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 100, 50, 96, 16)
      ]);
      em.spawnFromLevel(level, collision);

      expect(em.npcs[0].config).toEqual(NPC_CONFIGS.Motorcycle_Rider);
    });

    it('creates LevelTransition objects from Door and LevelExit', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Door', 400, 100, 16, 32, { targetLevel: 'Level_2', targetSpawn: 'SpawnFromLevel1' }),
        entity('LevelExit', 500, 150, 32, 16, { targetLevel: 'Level_1', targetSpawn: 'SpawnFromLevel2' })
      ]);
      em.spawnFromLevel(level, collision);

      expect(em.doors).toHaveLength(2);
      expect(em.doors[0]).toEqual({
        x: 400, y: 100, width: 16, height: 32,
        targetLevel: 'Level_2', targetSpawn: 'SpawnFromLevel1'
      });
      expect(em.doors[1]).toEqual({
        x: 500, y: 150, width: 32, height: 16,
        targetLevel: 'Level_1', targetSpawn: 'SpawnFromLevel2'
      });
    });

    it('handles doors with missing fields gracefully', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Door', 400, 100, 16, 32)
      ]);
      em.spawnFromLevel(level, collision);

      expect(em.doors[0].targetLevel).toBe('');
      expect(em.doors[0].targetSpawn).toBe('');
    });

    it('resets collections on each call', () => {
      const level1 = makeLevel([
        entity('PlayerStart', 10, 20),
        entity('Motorcycle_Rider', 100, 50, 96, 16)
      ]);
      em.spawnFromLevel(level1, collision);
      expect(em.npcs).toHaveLength(1);

      const level2 = makeLevel([entity('PlayerStart', 30, 40)]);
      em.spawnFromLevel(level2, collision);
      expect(em.npcs).toHaveLength(0);
      expect(em.player.x).toBe(30);
    });

    it('handles empty entity list', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const level = makeLevel([]);
      em.spawnFromLevel(level, collision);

      expect(em.player).not.toBeNull();
      expect(em.player.x).toBe(0);
      expect(em.player.y).toBe(0);
      expect(em.npcs).toHaveLength(0);
      expect(em.doors).toHaveLength(0);
      warnSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('updates player and follower without errors', () => {
      const level = makeLevel([entity('PlayerStart', 100, 100)]);
      em.spawnFromLevel(level, collision);

      const input = { dx: 1, dy: 0, interact: false };
      expect(() => em.update(0.016, input, { x: 100, y: 100 })).not.toThrow();
    });

    it('moves the player when input is provided', () => {
      const level = makeLevel([entity('PlayerStart', 100, 100)]);
      em.spawnFromLevel(level, collision);

      const startX = em.player.x;
      em.update(0.1, { dx: 1, dy: 0, interact: false }, { x: 100, y: 100 });
      expect(em.player.x).toBeGreaterThan(startX);
    });
  });

  describe('getEntitiesInRange', () => {
    it('returns NPCs within range', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 100, 100, 16, 16)
      ]);
      em.spawnFromLevel(level, collision);

      // NPC center is (108, 108), query from (108, 108) → distance 0
      const nearby = em.getEntitiesInRange(108, 108, 32);
      expect(nearby).toHaveLength(1);
      expect(nearby[0].identifier).toBe('Motorcycle_Rider');
    });

    it('returns doors within range', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Door', 100, 100, 16, 32, { targetLevel: 'Level_2', targetSpawn: 'Spawn1' })
      ]);
      em.spawnFromLevel(level, collision);

      // Door center is (108, 116), query from (108, 116) → distance 0
      const nearby = em.getEntitiesInRange(108, 116, 32);
      expect(nearby).toHaveLength(1);
      expect(nearby[0].targetLevel).toBe('Level_2');
    });

    it('excludes entities outside range', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 500, 500, 16, 16)
      ]);
      em.spawnFromLevel(level, collision);

      const nearby = em.getEntitiesInRange(0, 0, 32);
      expect(nearby).toHaveLength(0);
    });

    it('returns both NPCs and doors when in range', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 100, 100, 16, 16),
        entity('Door', 105, 100, 16, 16, { targetLevel: 'Level_2', targetSpawn: 'S' })
      ]);
      em.spawnFromLevel(level, collision);

      // Both entities are near (108, 108)
      const nearby = em.getEntitiesInRange(108, 108, 50);
      expect(nearby).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('removes all entities', () => {
      const level = makeLevel([
        entity('PlayerStart', 0, 0),
        entity('Motorcycle_Rider', 100, 50, 96, 16),
        entity('Door', 200, 100, 16, 32, { targetLevel: 'Level_2', targetSpawn: 'S' })
      ]);
      em.spawnFromLevel(level, collision);

      expect(em.player).not.toBeNull();
      expect(em.npcs).toHaveLength(1);
      expect(em.doors).toHaveLength(1);

      em.clear();

      expect(em.player).toBeNull();
      expect(em.follower).toBeNull();
      expect(em.npcs).toEqual([]);
      expect(em.doors).toEqual([]);
    });
  });
});

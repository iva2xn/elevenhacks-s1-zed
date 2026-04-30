import { describe, it, expect } from 'vitest';
import { NPC, NPC_CONFIGS } from './NPC.js';

describe('NPC', () => {
  const testConfig = {
    name: '测试角色',
    greeting: '你好！',
    personality: 'Friendly test NPC',
    scenario: 'A test scenario'
  };

  describe('constructor', () => {
    it('initializes with all provided properties', () => {
      const npc = new NPC('TestNPC', 100, 200, 16, 16, testConfig);

      expect(npc.identifier).toBe('TestNPC');
      expect(npc.x).toBe(100);
      expect(npc.y).toBe(200);
      expect(npc.width).toBe(16);
      expect(npc.height).toBe(16);
      expect(npc.config).toEqual(testConfig);
      expect(npc.interactionRange).toBe(32);
      expect(npc.showPrompt).toBe(false);
    });

    it('defaults config to empty object when not provided', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16);
      expect(npc.config).toEqual({});
    });
  });

  describe('isInRange', () => {
    it('returns true when player is at NPC center', () => {
      const npc = new NPC('TestNPC', 100, 100, 16, 16, testConfig);
      // NPC center is (108, 108)
      expect(npc.isInRange(108, 108)).toBe(true);
    });

    it('returns true when player is within default range (32px)', () => {
      const npc = new NPC('TestNPC', 100, 100, 16, 16, testConfig);
      // NPC center is (108, 108), player at (130, 108) → distance = 22
      expect(npc.isInRange(130, 108)).toBe(true);
    });

    it('returns false when player is outside default range', () => {
      const npc = new NPC('TestNPC', 100, 100, 16, 16, testConfig);
      // NPC center is (108, 108), player at (200, 108) → distance = 92
      expect(npc.isInRange(200, 108)).toBe(false);
    });

    it('uses custom range when provided', () => {
      const npc = new NPC('TestNPC', 100, 100, 16, 16, testConfig);
      // NPC center is (108, 108), player at (150, 108) → distance = 42
      expect(npc.isInRange(150, 108, 50)).toBe(true);
      expect(npc.isInRange(150, 108, 30)).toBe(false);
    });

    it('calculates distance using center of NPC bounding box', () => {
      const npc = new NPC('TestNPC', 0, 0, 96, 16, testConfig);
      // NPC center is (48, 8)
      // Player at (48, 8) → distance = 0
      expect(npc.isInRange(48, 8)).toBe(true);
      // Player at (0, 0) → distance = sqrt(48^2 + 8^2) ≈ 48.66
      expect(npc.isInRange(0, 0, 49)).toBe(true);
      expect(npc.isInRange(0, 0, 48)).toBe(false);
    });

    it('returns true at exactly the range boundary', () => {
      const npc = new NPC('TestNPC', 0, 0, 0, 0, testConfig);
      // NPC center is (0, 0), player at (32, 0) → distance = 32
      expect(npc.isInRange(32, 0, 32)).toBe(true);
    });
  });

  describe('getGreeting', () => {
    it('returns the greeting from config', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, testConfig);
      expect(npc.getGreeting()).toBe('你好！');
    });

    it('returns empty string when no greeting in config', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, {});
      expect(npc.getGreeting()).toBe('');
    });

    it('returns empty string when config is undefined', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16);
      expect(npc.getGreeting()).toBe('');
    });
  });

  describe('getContext', () => {
    it('returns full context object with all fields', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, testConfig);
      const context = npc.getContext();

      expect(context).toEqual({
        identifier: 'TestNPC',
        name: '测试角色',
        greeting: '你好！',
        personality: 'Friendly test NPC',
        scenario: 'A test scenario'
      });
    });

    it('falls back to identifier for missing name', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, { greeting: 'Hi' });
      const context = npc.getContext();
      expect(context.name).toBe('TestNPC');
    });

    it('returns empty strings for missing config fields', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16);
      const context = npc.getContext();

      expect(context.identifier).toBe('TestNPC');
      expect(context.name).toBe('TestNPC');
      expect(context.greeting).toBe('');
      expect(context.personality).toBe('');
      expect(context.scenario).toBe('');
    });
  });

  describe('showPrompt', () => {
    it('defaults to false', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, testConfig);
      expect(npc.showPrompt).toBe(false);
    });

    it('can be set externally', () => {
      const npc = new NPC('TestNPC', 0, 0, 16, 16, testConfig);
      npc.showPrompt = true;
      expect(npc.showPrompt).toBe(true);
      npc.showPrompt = false;
      expect(npc.showPrompt).toBe(false);
    });
  });
});

describe('NPC_CONFIGS', () => {
  it('contains config for Motorcycle_Rider', () => {
    const config = NPC_CONFIGS.Motorcycle_Rider;
    expect(config).toBeDefined();
    expect(config.name).toBe('摩托车骑手');
    expect(config.greeting).toBeTruthy();
    expect(config.personality).toBeTruthy();
    expect(config.scenario).toBeTruthy();
  });

  it('contains config for Motorcycle_Rider_2', () => {
    const config = NPC_CONFIGS.Motorcycle_Rider_2;
    expect(config).toBeDefined();
    expect(config.name).toBeTruthy();
    expect(config.greeting).toBeTruthy();
    expect(config.personality).toBeTruthy();
    expect(config.scenario).toBeTruthy();
  });

  it('contains config for TimeWaste', () => {
    const config = NPC_CONFIGS.TimeWaste;
    expect(config).toBeDefined();
    expect(config.name).toBe('闲聊大叔');
    expect(config.greeting).toBeTruthy();
    expect(config.personality).toBeTruthy();
    expect(config.scenario).toBeTruthy();
  });

  it('each config has all required fields', () => {
    const requiredFields = ['name', 'greeting', 'personality', 'scenario'];
    for (const [id, config] of Object.entries(NPC_CONFIGS)) {
      for (const field of requiredFields) {
        expect(config[field], `${id} missing ${field}`).toBeTruthy();
      }
    }
  });

  it('Motorcycle_Rider and Motorcycle_Rider_2 have different greetings', () => {
    expect(NPC_CONFIGS.Motorcycle_Rider.greeting)
      .not.toBe(NPC_CONFIGS.Motorcycle_Rider_2.greeting);
  });
});

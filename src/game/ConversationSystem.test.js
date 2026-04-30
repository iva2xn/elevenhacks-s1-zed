import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationSystem } from './ConversationSystem.js';

// Mock the elevenlabs API stubs so tests run instantly
vi.mock('../api/elevenlabs.js', () => ({
  transcribeSpeechWithElevenLabs: vi.fn().mockResolvedValue('你好，我想问一下路。'),
  generateNativeChineseResponse: vi.fn().mockResolvedValue('你好！你想去哪里？我可以帮你。'),
  speakWithElevenLabs: vi.fn().mockResolvedValue(undefined)
}));

import {
  transcribeSpeechWithElevenLabs,
  generateNativeChineseResponse,
  speakWithElevenLabs
} from '../api/elevenlabs.js';

function makeNpcContext() {
  return {
    identifier: 'Motorcycle_Rider',
    name: '摩托车骑手',
    greeting: '嘿，朋友！',
    personality: 'Friendly biker',
    scenario: 'Asking for directions'
  };
}

describe('ConversationSystem', () => {
  let cs;

  beforeEach(() => {
    cs = new ConversationSystem();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(cs.transcript).toEqual([]);
      expect(cs.isProcessing).toBe(false);
      expect(cs.npcContext).toBeNull();
      expect(cs.startTime).toBeNull();
    });
  });

  describe('startSession', () => {
    it('initializes transcript, start time, and NPC context', async () => {
      const ctx = makeNpcContext();
      await cs.startSession(ctx);

      expect(cs.transcript).toEqual([]);
      expect(cs.npcContext).toBe(ctx);
      expect(cs.startTime).toBeTypeOf('number');
      expect(cs.isProcessing).toBe(false);
    });

    it('resets transcript when starting a new session', async () => {
      const ctx = makeNpcContext();
      await cs.startSession(ctx);

      // Simulate adding entries
      cs.transcript.push({ role: 'player', text: 'test', timestamp: 0 });

      // Start a fresh session
      await cs.startSession(ctx);
      expect(cs.transcript).toEqual([]);
    });
  });

  describe('captureAndRespond', () => {
    it('returns two transcript entries (player + npc)', async () => {
      await cs.startSession(makeNpcContext());
      const result = await cs.captureAndRespond();

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('player');
      expect(result[0].text).toBe('你好，我想问一下路。');
      expect(result[0].timestamp).toBeTypeOf('number');
      expect(result[1].role).toBe('npc');
      expect(result[1].text).toBe('你好！你想去哪里？我可以帮你。');
      expect(result[1].timestamp).toBeTypeOf('number');
    });

    it('calls API stubs in the correct order', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();

      expect(transcribeSpeechWithElevenLabs).toHaveBeenCalledWith(null);
      expect(generateNativeChineseResponse).toHaveBeenCalledWith(
        '你好，我想问一下路。',
        cs.npcContext
      );
      expect(speakWithElevenLabs).toHaveBeenCalledWith('你好！你想去哪里？我可以帮你。');
    });

    it('adds entries to the transcript history', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();

      expect(cs.transcript).toHaveLength(2);
      expect(cs.transcript[0].role).toBe('player');
      expect(cs.transcript[1].role).toBe('npc');
    });

    it('accumulates entries across multiple calls', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();
      await cs.captureAndRespond();

      expect(cs.transcript).toHaveLength(4);
    });

    it('sets isProcessing to false after completion', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();

      expect(cs.isProcessing).toBe(false);
    });

    it('returns null when already processing (prevents overlapping calls)', async () => {
      await cs.startSession(makeNpcContext());

      // Manually set processing flag
      cs.isProcessing = true;
      const result = await cs.captureAndRespond();

      expect(result).toBeNull();
    });

    it('resets isProcessing even if an API call throws', async () => {
      await cs.startSession(makeNpcContext());
      transcribeSpeechWithElevenLabs.mockRejectedValueOnce(new Error('API error'));

      await expect(cs.captureAndRespond()).rejects.toThrow('API error');
      expect(cs.isProcessing).toBe(false);
    });
  });

  describe('endSession', () => {
    it('returns the full transcript and resets state', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();

      const history = cs.endSession();

      expect(history).toHaveLength(2);
      expect(cs.transcript).toEqual([]);
      expect(cs.npcContext).toBeNull();
      expect(cs.startTime).toBeNull();
      expect(cs.isProcessing).toBe(false);
    });

    it('returns empty array when no conversation happened', async () => {
      await cs.startSession(makeNpcContext());
      const history = cs.endSession();

      expect(history).toEqual([]);
    });
  });

  describe('getTranscriptHistory', () => {
    it('returns the current transcript array', async () => {
      await cs.startSession(makeNpcContext());
      await cs.captureAndRespond();

      const history = cs.getTranscriptHistory();
      expect(history).toHaveLength(2);
      expect(history).toBe(cs.transcript);
    });
  });

  describe('getElapsedTime', () => {
    it('returns 0 when no session is active', () => {
      expect(cs.getElapsedTime()).toBe(0);
    });

    it('returns elapsed time in seconds after session start', async () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      await cs.startSession(makeNpcContext());

      // Advance time by 5 seconds
      vi.spyOn(Date, 'now').mockReturnValue(now + 5000);
      expect(cs.getElapsedTime()).toBe(5);

      vi.restoreAllMocks();
    });
  });
});

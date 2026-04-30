/**
 * ConversationSystem - Manages the speech capture → transcribe → respond → playback cycle.
 *
 * Orchestrates a full conversation session between the player and an NPC by
 * calling the stubbed ElevenLabs API functions in sequence and maintaining a
 * timestamped transcript of all exchanges.
 */

import {
  transcribeSpeechWithElevenLabs,
  generateNativeChineseResponse,
  speakWithElevenLabs
} from '../api/elevenlabs.js';

export class ConversationSystem {
  constructor() {
    /** @type {Array<{role: 'player'|'npc', text: string, timestamp: number}>} */
    this.transcript = [];

    /** True while a captureAndRespond cycle is in progress. */
    this.isProcessing = false;

    /** NPC context for the active session. */
    this.npcContext = null;

    /** Timestamp (ms) when the session started. */
    this.startTime = null;
  }

  /**
   * Begin a new conversation session.
   * Initialises the transcript, records the start time, and stores the NPC context.
   *
   * @param {object} npcContext - NPC context object { identifier, name, greeting, personality, scenario }
   */
  async startSession(npcContext) {
    this.transcript = [];
    this.startTime = Date.now();
    this.npcContext = npcContext;
    this.isProcessing = false;
  }

  /**
   * Execute a full speak cycle: capture → transcribe → respond → playback.
   *
   * 1. Set isProcessing = true
   * 2. Transcribe player speech via STT stub
   * 3. Add player entry to transcript
   * 4. Generate NPC response via conversational AI stub
   * 5. Add NPC entry to transcript
   * 6. Play back NPC response via TTS stub
   * 7. Set isProcessing = false
   *
   * @returns {Promise<Array<{role: string, text: string, timestamp: number}>|null>}
   *   The two new transcript entries (player + npc), or null if already processing.
   */
  async captureAndRespond() {
    // Prevent overlapping calls
    if (this.isProcessing) {
      return null;
    }

    this.isProcessing = true;

    try {
      // Step 1 – Transcribe player speech (null audioBlob for mock)
      const transcriptText = await transcribeSpeechWithElevenLabs(null);

      // Step 2 – Record player entry
      const playerEntry = {
        role: 'player',
        text: transcriptText,
        timestamp: Date.now() - this.startTime
      };
      this.transcript.push(playerEntry);

      // Step 3 – Generate NPC response
      const responseText = await generateNativeChineseResponse(transcriptText, this.npcContext);

      // Step 4 – Record NPC entry
      const npcEntry = {
        role: 'npc',
        text: responseText,
        timestamp: Date.now() - this.startTime
      };
      this.transcript.push(npcEntry);

      // Step 5 – Play back the NPC response audio
      await speakWithElevenLabs(responseText);

      return [playerEntry, npcEntry];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * End the current session and return the full transcript history.
   * Resets internal state so a new session can be started.
   *
   * @returns {Array<{role: 'player'|'npc', text: string, timestamp: number}>}
   */
  endSession() {
    const history = this.transcript;
    this.transcript = [];
    this.npcContext = null;
    this.startTime = null;
    this.isProcessing = false;
    return history;
  }

  /**
   * Get the full transcript history for the active session.
   *
   * @returns {Array<{role: 'player'|'npc', text: string, timestamp: number}>}
   */
  getTranscriptHistory() {
    return this.transcript;
  }

  /**
   * Get elapsed time in seconds since the session started.
   *
   * @returns {number} Elapsed seconds, or 0 if no session is active.
   */
  getElapsedTime() {
    if (this.startTime === null) {
      return 0;
    }
    return (Date.now() - this.startTime) / 1000;
  }
}

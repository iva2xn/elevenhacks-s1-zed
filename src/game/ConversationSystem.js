/**
 * ConversationSystem — manages the speak → transcribe → evaluate → respond cycle
 * with 3-attempt fallback logic.
 *
 * Attempt 1-2: Chinese only
 * Attempt 3: English allowed
 * If all 3 fail: auto-advance with 2-day penalty
 */

import {
  recordAudio,
  stopRecording,
  transcribeSpeechWithElevenLabs,
  generateNativeChineseResponse,
  speakWithElevenLabs,
  evaluateResponse
} from '../api/elevenlabs.js';

export class ConversationSystem {
  constructor() {
    this.transcript = [];
    this.isProcessing = false;
    this.isRecording = false;
    this.npcContext = null;
    this.startTime = null;
    this.attempt = 0;
    this.maxAttempts = 3;
    this.mission = null;
    this.missionComplete = false;
    this._recordingPromise = null;
  }

  async startSession(npcContext, mission) {
    this.transcript = [];
    this.startTime = Date.now();
    this.npcContext = npcContext;
    this.attempt = 0;
    this.mission = mission;
    this.missionComplete = false;
    this.isProcessing = false;
    this.isRecording = false;
  }

  /**
   * Start recording audio from the microphone.
   */
  async startRecording() {
    if (this.isRecording || this.isProcessing) return;
    this.isRecording = true;
    this._recordingPromise = recordAudio();
  }

  /**
   * Stop recording and process the audio:
   * transcribe → evaluate → generate NPC response → TTS playback.
   *
   * @returns {Promise<{entries: Array, understood: boolean, attempt: number, autoAdvance: boolean}>}
   */
  async stopAndProcess() {
    if (!this.isRecording) return null;

    this.isRecording = false;
    this.isProcessing = true;
    this.attempt++;

    try {
      // Stop recording and get the audio blob
      stopRecording();
      const audioBlob = await this._recordingPromise;

      // Transcribe
      const playerText = await transcribeSpeechWithElevenLabs(audioBlob);

      const playerEntry = {
        role: 'player',
        text: playerText || '(try speaking louder or closer to the mic)',
        timestamp: Date.now() - this.startTime
      };
      this.transcript.push(playerEntry);

      // If nothing was detected, don't count as an attempt
      if (!playerText || playerText.trim().length === 0) {
        this.attempt--;
      }

      // Evaluate against mission
      const evaluation = this.mission
        ? evaluateResponse(playerText, this.mission, this.attempt)
        : { understood: true, language: 'chinese' };

      this.missionComplete = evaluation.understood;

      // Generate NPC response
      const npcText = await generateNativeChineseResponse(
        playerText, this.npcContext, this.attempt, evaluation.understood
      );

      const npcEntry = {
        role: 'npc',
        text: npcText,
        timestamp: Date.now() - this.startTime
      };
      this.transcript.push(npcEntry);

      // Speak the NPC response via TTS
      // Use a different voice for English responses on attempt 3
      const isEnglishResponse = this.attempt >= 3 && !evaluation.understood;
      await speakWithElevenLabs(npcText);

      // Check if we've exhausted all attempts without success
      const autoAdvance = !this.missionComplete && this.attempt >= this.maxAttempts;

      return {
        entries: [playerEntry, npcEntry],
        understood: evaluation.understood,
        attempt: this.attempt,
        autoAdvance
      };
    } finally {
      this.isProcessing = false;
    }
  }

  endSession() {
    const history = this.transcript;
    this.transcript = [];
    this.npcContext = null;
    this.startTime = null;
    this.attempt = 0;
    this.mission = null;
    this.missionComplete = false;
    this.isProcessing = false;
    this.isRecording = false;
    return history;
  }

  getTranscriptHistory() {
    return this.transcript;
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
}

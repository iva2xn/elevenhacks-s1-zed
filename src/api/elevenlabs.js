/**
 * Stubbed ElevenLabs API functions.
 * Each function is an async stub returning mock data after a simulated delay.
 *
 * To integrate real ElevenLabs APIs, replace the mock logic inside each
 * function body while keeping the same function signatures. Look for the
 * "REPLACE:" comments in each function for specific guidance.
 */

import { CONFIG } from '../game/Config.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Simulate network delay.
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Rotating index counters for mock data variety. */
let _transcriptIndex = 0;
let _fallbackResponseIndex = 0;

// ---------------------------------------------------------------------------
// Mock data pools
// ---------------------------------------------------------------------------

/**
 * Pool of mock Chinese transcripts returned by the STT stub.
 * Each represents a plausible player utterance.
 */
const MOCK_TRANSCRIPTS = [
  '你好，我想问一下路。',
  '请问附近有没有好吃的餐厅？',
  '今天天气真不错，你觉得呢？',
  '我是从美国来的，正在学中文。'
];

/**
 * NPC-specific mock response pools keyed by NPC identifier.
 * When the NPC identifier is recognised, responses are drawn from the
 * matching pool so that mock conversations feel contextually appropriate.
 */
const NPC_MOCK_RESPONSES = {
  Motorcycle_Rider: [
    '嘿，朋友！沿着这条路一直走，到路口左转就到了。',
    '骑摩托车最开心了！你要不要试试？',
    '这附近有个很好的面馆，我经常去吃。'
  ],
  Motorcycle_Rider_2: [
    '城里现在堵车堵得厉害，你最好走小路。',
    '我刚从市中心过来，那边新开了一家书店。',
    '小心前面的路口，最近在修路。'
  ],
  TimeWaste: [
    '哎呀，今天天气真好啊！你吃了吗？',
    '我跟你说啊，隔壁老王家的猫又跑了！',
    '年轻人，别着急，坐下来喝杯茶再走嘛。'
  ]
};

/**
 * Fallback responses used when the NPC identifier is not recognised.
 */
const FALLBACK_RESPONSES = [
  '你好！你想去哪里？我可以帮你。',
  '没问题，我很乐意帮忙。',
  '好的，你还有什么想问的吗？'
];

// ---------------------------------------------------------------------------
// Public API stubs
// ---------------------------------------------------------------------------

/**
 * Transcribe speech audio to text.
 *
 * REPLACE: Replace the mock logic below with a real ElevenLabs Speech-to-Text
 * API call. Example implementation outline:
 *
 *   const formData = new FormData();
 *   formData.append('audio', audioBlob);
 *   const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
 *     method: 'POST',
 *     headers: { 'xi-api-key': CONFIG.api.elevenLabsApiKey },
 *     body: formData
 *   });
 *   const data = await res.json();
 *   return data.text;
 *
 * @param {Blob} audioBlob - Captured audio data
 * @returns {Promise<string>} Transcribed Chinese text
 */
export async function transcribeSpeechWithElevenLabs(audioBlob) {
  // --- Mock implementation (remove when integrating real API) ---
  await delay(500);
  const transcript = MOCK_TRANSCRIPTS[_transcriptIndex % MOCK_TRANSCRIPTS.length];
  _transcriptIndex++;
  return transcript;
}

/**
 * Generate a native Chinese response from an NPC.
 *
 * REPLACE: Replace the mock logic below with a real ElevenLabs Conversational
 * AI or LLM call. Example implementation outline:
 *
 *   const res = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
 *     method: 'POST',
 *     headers: {
 *       'xi-api-key': CONFIG.api.elevenLabsApiKey,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *       model_id: CONFIG.api.modelId,
 *       transcript,
 *       context: {
 *         name: npcContext.name,
 *         personality: npcContext.personality,
 *         scenario: npcContext.scenario
 *       }
 *     })
 *   });
 *   const data = await res.json();
 *   return data.response;
 *
 * @param {string} transcript - Current conversation transcript
 * @param {object} npcContext - NPC context { identifier, name, personality, scenario }
 * @returns {Promise<string>} NPC response in Chinese
 */
export async function generateNativeChineseResponse(transcript, npcContext) {
  // --- Mock implementation (remove when integrating real API) ---
  await delay(800);

  // Pick from NPC-specific pool when the identifier is known
  const npcId = npcContext && npcContext.identifier;
  const pool = NPC_MOCK_RESPONSES[npcId];

  if (pool) {
    // Rotate through the NPC-specific responses
    const idx = _fallbackResponseIndex % pool.length;
    _fallbackResponseIndex++;
    return pool[idx];
  }

  // Fallback for unknown NPCs
  const response = FALLBACK_RESPONSES[_fallbackResponseIndex % FALLBACK_RESPONSES.length];
  _fallbackResponseIndex++;
  return response;
}

/**
 * Speak text aloud using text-to-speech.
 *
 * REPLACE: Replace the mock logic below with a real ElevenLabs Text-to-Speech
 * API call. Example implementation outline:
 *
 *   const voiceId = 'YOUR_VOICE_ID';
 *   const res = await fetch(
 *     `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
 *     {
 *       method: 'POST',
 *       headers: {
 *         'xi-api-key': CONFIG.api.elevenLabsApiKey,
 *         'Content-Type': 'application/json'
 *       },
 *       body: JSON.stringify({ text, model_id: CONFIG.api.modelId })
 *     }
 *   );
 *   const audioBlob = await res.blob();
 *   const audioUrl = URL.createObjectURL(audioBlob);
 *   const audio = new Audio(audioUrl);
 *   await new Promise(resolve => { audio.onended = resolve; audio.play(); });
 *
 * @param {string} text - Chinese text to speak
 * @returns {Promise<void>} Resolves when playback completes
 */
export async function speakWithElevenLabs(text) {
  // --- Mock implementation (remove when integrating real API) ---
  await delay(1000);
}

/**
 * Score a conversation across multiple dimensions.
 *
 * REPLACE: Replace the mock logic below with a real scoring API call.
 * Example implementation outline:
 *
 *   const res = await fetch('https://your-scoring-endpoint.example.com/score', {
 *     method: 'POST',
 *     headers: {
 *       'xi-api-key': CONFIG.api.elevenLabsApiKey,
 *       'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({ transcriptHistory, audioMetrics })
 *   });
 *   return await res.json();
 *
 * @param {Array<{role: string, text: string, timestamp: number}>} transcriptHistory
 * @param {object} audioMetrics - Audio quality metrics
 * @returns {Promise<{fluency: number, pronunciation: number, naturalness: number, vocabulary: number, grammar: number, nativeLikeness: number}>}
 */
export async function scoreConversation(transcriptHistory, audioMetrics) {
  // --- Mock implementation (remove when integrating real API) ---
  await delay(600);

  // Vary scores slightly based on how much the player has said.
  const entryCount = Array.isArray(transcriptHistory) ? transcriptHistory.length : 0;
  const bonus = Math.min(entryCount * 2, 15); // up to +15 for longer conversations

  return {
    fluency: 70 + bonus + Math.round(Math.random() * 5),
    pronunciation: 65 + bonus + Math.round(Math.random() * 5),
    naturalness: 60 + bonus + Math.round(Math.random() * 5),
    vocabulary: 72 + bonus + Math.round(Math.random() * 5),
    grammar: 68 + bonus + Math.round(Math.random() * 5),
    nativeLikeness: 55 + bonus + Math.round(Math.random() * 5)
  };
}

/**
 * ElevenLabs API integration — real STT, TTS, and conversation evaluation.
 * Loads API key from /config.local.js (gitignored).
 * Falls back to mock mode if config is missing.
 */

let API_KEY = '';
let USE_MOCKS = true;

// Load API key — wrapped in a function to avoid top-level await issues
async function loadApiKey() {
  try {
    const module = await import('/config.local.js');
    API_KEY = module.LOCAL_CONFIG?.elevenLabsApiKey || '';
    USE_MOCKS = !API_KEY || API_KEY === 'YOUR_ELEVENLABS_API_KEY_HERE';
  } catch (e) {
    console.warn('ElevenLabs: config.local.js not found — using mock mode');
    USE_MOCKS = true;
  }
}

// Start loading immediately
const _keyReady = loadApiKey();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let _mockIndex = 0;
const MOCK_TRANSCRIPTS = [
  '你好，请问往北怎么走？',
  '我想去北边，怎么走？',
  '请问北边在哪个方向？'
];

const MOCK_NPC_RESPONSES = {
  Motorcycle_Rider: ['往北走的话，沿着这条路一直走，到路口左转就到了。'],
  Motorcycle_Rider_2: ['往北走？从这里直走，看到红绿灯右转就行了。']
};

// ── Recording ──

export async function recordAudio() {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: mediaRecorder.mimeType }));
      };

      mediaRecorder.onerror = (e) => {
        stream.getTracks().forEach(t => t.stop());
        reject(e.error || new Error('Recording failed'));
      };

      mediaRecorder.start();
      window._activeMediaRecorder = mediaRecorder;
    } catch (err) {
      reject(err);
    }
  });
}

export function stopRecording() {
  if (window._activeMediaRecorder && window._activeMediaRecorder.state === 'recording') {
    window._activeMediaRecorder.stop();
    window._activeMediaRecorder = null;
  }
}

// ── STT ──

export async function transcribeSpeechWithElevenLabs(audioBlob) {
  await _keyReady;

  if (USE_MOCKS) {
    await delay(500);
    const t = MOCK_TRANSCRIPTS[_mockIndex % MOCK_TRANSCRIPTS.length];
    _mockIndex++;
    return t;
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model_id', 'scribe_v1');

  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: formData
  });

  if (!res.ok) {
    console.error('STT error:', await res.text());
    return '';
  }

  const data = await res.json();
  return data.text || '';
}

// ── TTS ──

export async function speakWithElevenLabs(text, voiceId) {
  await _keyReady;

  if (USE_MOCKS) {
    await delay(1000);
    return;
  }

  const vid = voiceId || 'onwK4e9ZLuTAKqWW03F9'; // Male voice
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, model_id: 'eleven_flash_v2_5' })
  });

  if (!res.ok) {
    console.error('TTS error:', await res.text());
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise((resolve) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play().catch(() => resolve());
  });
}

// ── Evaluation ──

export function evaluateResponse(transcript, mission, attempt) {
  if (!transcript || transcript.trim().length === 0) {
    return { understood: false, language: 'none' };
  }

  const text = transcript.toLowerCase().trim();

  if (mission.keywords.some(kw => text.includes(kw))) {
    return { understood: true, language: 'chinese' };
  }

  if (attempt >= 3 && mission.keywordsEnglish.some(kw => text.includes(kw))) {
    return { understood: true, language: 'english' };
  }

  return { understood: false, language: attempt >= 3 ? 'english' : 'chinese' };
}

// ── NPC Response ──

export async function generateNativeChineseResponse(transcript, npcContext, attempt, understood) {
  await _keyReady;

  if (understood) {
    const pool = MOCK_NPC_RESPONSES[npcContext?.identifier] || ['好的，往北走就对了。'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (attempt >= 3) {
    return "I don't quite understand. The north is that way — just go straight ahead past the intersection.";
  }

  if (attempt === 2) {
    return '你说什么？再说一次好吗？慢一点说。';
  }

  return '我听不太懂，你能再说一次吗？';
}

// ── Scoring (stub) ──

export async function scoreConversation(transcriptHistory, audioMetrics) {
  await delay(100);
  return {
    fluency: 75, pronunciation: 70, naturalness: 65,
    vocabulary: 80, grammar: 72, nativeLikeness: 60
  };
}

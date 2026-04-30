/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the imported modules so they don't cause side-effects
vi.mock('./ConversationSystem.js', () => ({
  ConversationSystem: class {}
}));
vi.mock('./ScoringSystem.js', () => ({
  ScoringSystem: class {}
}));

import { DialogSystem } from './DialogSystem.js';

/** Helper: create a minimal NPC-like object matching the NPC interface. */
function makeNPC(overrides = {}) {
  const defaults = {
    identifier: 'Motorcycle_Rider',
    config: {
      name: '摩托车骑手',
      greeting: '嘿，朋友！你也喜欢骑摩托车吗？',
      personality: 'Friendly biker',
      scenario: 'Roadside chat'
    }
  };
  const merged = { ...defaults, ...overrides };
  return {
    identifier: merged.identifier,
    getContext() {
      return {
        identifier: merged.identifier,
        name: merged.config.name,
        greeting: merged.config.greeting,
        personality: merged.config.personality,
        scenario: merged.config.scenario
      };
    },
    getGreeting() {
      return merged.config.greeting;
    }
  };
}

describe('DialogSystem', () => {
  let container;
  let dialog;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    container.id = 'dialogContainer';
    document.body.appendChild(container);
    dialog = new DialogSystem(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('creates DOM elements inside the container', () => {
      expect(container.querySelector('.dialog-box')).not.toBeNull();
      expect(container.querySelector('.npc-name')).not.toBeNull();
      expect(container.querySelector('.greeting-text')).not.toBeNull();
      expect(container.querySelector('.transcript-area')).not.toBeNull();
      expect(container.querySelector('.timer')).not.toBeNull();
      expect(container.querySelector('.dialog-buttons')).not.toBeNull();
      expect(container.querySelector('.results-screen')).not.toBeNull();
    });

    it('starts hidden', () => {
      expect(container.style.display).toBe('none');
    });

    it('initializes state correctly', () => {
      expect(dialog.isOpen).toBe(false);
      expect(dialog.activeNPC).toBeNull();
      expect(dialog.conversationActive).toBe(false);
    });
  });

  describe('open(npc)', () => {
    it('shows the container and sets NPC info', () => {
      const npc = makeNPC();
      dialog.open(npc);

      expect(container.style.display).toBe('block');
      expect(dialog.isOpen).toBe(true);
      expect(dialog.activeNPC).toBe(npc);
      expect(container.querySelector('.npc-name').textContent).toBe('摩托车骑手');
      expect(container.querySelector('.greeting-text').textContent).toBe(
        '嘿，朋友！你也喜欢骑摩托车吗？'
      );
    });

    it('shows Start Conversation and Close buttons, hides Speak and End Conversation', () => {
      dialog.open(makeNPC());

      expect(dialog.startConversationBtn.style.display).not.toBe('none');
      expect(dialog.closeBtn.style.display).not.toBe('none');
      expect(dialog.speakBtn.style.display).toBe('none');
      expect(dialog.endConversationBtn.style.display).toBe('none');
    });

    it('hides transcript area and timer', () => {
      dialog.open(makeNPC());

      expect(dialog.transcriptArea.style.display).toBe('none');
      expect(dialog.timerEl.style.display).toBe('none');
    });

    it('calls onOpen callback', () => {
      const onOpen = vi.fn();
      dialog.onOpen = onOpen;
      const npc = makeNPC();
      dialog.open(npc);

      expect(onOpen).toHaveBeenCalledWith(npc);
    });
  });

  describe('close()', () => {
    it('hides the container and resets state', () => {
      dialog.open(makeNPC());
      dialog.close();

      expect(container.style.display).toBe('none');
      expect(dialog.isOpen).toBe(false);
      expect(dialog.activeNPC).toBeNull();
    });

    it('calls onClose callback', () => {
      const onClose = vi.fn();
      dialog.onClose = onClose;
      dialog.open(makeNPC());
      dialog.close();

      expect(onClose).toHaveBeenCalled();
    });

    it('stops the timer interval', () => {
      dialog.open(makeNPC());
      dialog.startConversation();
      expect(dialog.timerInterval).not.toBeNull();

      dialog.close();
      expect(dialog.timerInterval).toBeNull();
    });
  });

  describe('startConversation()', () => {
    beforeEach(() => {
      dialog.open(makeNPC());
    });

    it('hides Start Conversation button, shows Speak and End Conversation', () => {
      dialog.startConversation();

      expect(dialog.startConversationBtn.style.display).toBe('none');
      expect(dialog.speakBtn.style.display).not.toBe('none');
      expect(dialog.endConversationBtn.style.display).not.toBe('none');
    });

    it('shows transcript area and timer', () => {
      dialog.startConversation();

      expect(dialog.transcriptArea.style.display).not.toBe('none');
      expect(dialog.timerEl.style.display).not.toBe('none');
    });

    it('starts the timer interval', () => {
      dialog.startConversation();
      expect(dialog.timerInterval).not.toBeNull();
      expect(dialog.startTime).not.toBeNull();
    });

    it('calls onStartConversation callback', () => {
      const onStart = vi.fn();
      dialog.onStartConversation = onStart;
      dialog.startConversation();

      expect(onStart).toHaveBeenCalled();
    });

    it('updates timer display every second', () => {
      dialog.startConversation();

      vi.advanceTimersByTime(3000);
      expect(dialog.timerEl.textContent).toBe('00:03');
    });
  });

  describe('updateTranscript(entry)', () => {
    beforeEach(() => {
      dialog.open(makeNPC());
      dialog.startConversation();
    });

    it('appends player entry with "You:" prefix', () => {
      dialog.updateTranscript({ role: 'player', text: '你好' });

      const entries = dialog.transcriptArea.querySelectorAll('.transcript-entry');
      expect(entries).toHaveLength(1);
      expect(entries[0].textContent).toBe('You: 你好');
      expect(entries[0].classList.contains('player')).toBe(true);
    });

    it('appends NPC entry with NPC name prefix', () => {
      dialog.updateTranscript({ role: 'npc', text: '你好！你想去哪里？' });

      const entries = dialog.transcriptArea.querySelectorAll('.transcript-entry');
      expect(entries).toHaveLength(1);
      expect(entries[0].textContent).toBe('摩托车骑手: 你好！你想去哪里？');
      expect(entries[0].classList.contains('npc')).toBe(true);
    });

    it('accumulates multiple entries', () => {
      dialog.updateTranscript({ role: 'player', text: '你好' });
      dialog.updateTranscript({ role: 'npc', text: '你好！' });
      dialog.updateTranscript({ role: 'player', text: '谢谢' });

      const entries = dialog.transcriptArea.querySelectorAll('.transcript-entry');
      expect(entries).toHaveLength(3);
    });
  });

  describe('updateTimer(elapsed)', () => {
    it('formats seconds as MM:SS', () => {
      dialog.open(makeNPC());
      dialog.updateTimer(0);
      expect(dialog.timerEl.textContent).toBe('00:00');

      dialog.updateTimer(65);
      expect(dialog.timerEl.textContent).toBe('01:05');

      dialog.updateTimer(600);
      expect(dialog.timerEl.textContent).toBe('10:00');
    });
  });

  describe('showResults(scoreData)', () => {
    const scoreData = {
      fluency: 75,
      pronunciation: 70,
      naturalness: 65,
      vocabulary: 80,
      grammar: 72,
      nativeLikeness: 60,
      qualityScore: 72.5,
      finalScore: 68.3,
      starRating: 3,
      conversationTime: 95
    };

    beforeEach(() => {
      dialog.open(makeNPC());
      dialog.startConversation();
    });

    it('hides the dialog box and shows results screen', () => {
      dialog.showResults(scoreData);

      expect(dialog.dialogBox.style.display).toBe('none');
      expect(dialog.resultsScreen.style.display).not.toBe('none');
    });

    it('displays star rating', () => {
      dialog.showResults(scoreData);

      const starEl = dialog.resultsScreen.querySelector('.star-rating');
      expect(starEl.textContent).toBe('★★★☆☆');
    });

    it('displays all 6 dimension scores', () => {
      dialog.showResults(scoreData);

      const dims = dialog.resultsScreen.querySelector('.score-dimensions');
      expect(dims.children).toHaveLength(6);
    });

    it('displays conversation duration', () => {
      dialog.showResults(scoreData);

      expect(dialog.resultsScreen.textContent).toContain('01:35');
    });

    it('calls onResultsDismissed and closes when Continue is clicked', () => {
      const onDismissed = vi.fn();
      dialog.onResultsDismissed = onDismissed;
      dialog.showResults(scoreData);

      // Find and click the Continue button
      const continueBtn = dialog.resultsScreen.querySelector('button');
      expect(continueBtn.textContent).toBe('Continue');
      continueBtn.click();

      expect(onDismissed).toHaveBeenCalled();
      expect(dialog.isOpen).toBe(false);
      expect(container.style.display).toBe('none');
    });

    it('stops the timer', () => {
      expect(dialog.timerInterval).not.toBeNull();
      dialog.showResults(scoreData);
      expect(dialog.timerInterval).toBeNull();
    });
  });

  describe('button callbacks', () => {
    it('Speak button calls onSpeak callback', () => {
      const onSpeak = vi.fn();
      dialog.onSpeak = onSpeak;
      dialog.open(makeNPC());
      dialog.startConversation();

      dialog.speakBtn.click();
      expect(onSpeak).toHaveBeenCalled();
    });

    it('End Conversation button calls onEndConversation callback', () => {
      const onEnd = vi.fn();
      dialog.onEndConversation = onEnd;
      dialog.open(makeNPC());
      dialog.startConversation();

      dialog.endConversationBtn.click();
      expect(onEnd).toHaveBeenCalled();
    });

    it('Close button calls close()', () => {
      dialog.open(makeNPC());
      const onClose = vi.fn();
      dialog.onClose = onClose;

      dialog.closeBtn.click();
      expect(onClose).toHaveBeenCalled();
      expect(dialog.isOpen).toBe(false);
    });
  });
});

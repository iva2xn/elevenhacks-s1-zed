/**
 * DialogSystem — Pokémon-style dialog overlay.
 * Click Speak to start recording, click Stop to end recording and process.
 */

export class DialogSystem {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;
    this.startTime = null;
    this._isRecording = false;

    this.onOpen = null;
    this.onClose = null;
    this.onStartConversation = null;
    this.onStartRecording = null;
    this.onStopRecording = null;
    this.onEndConversation = null;

    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = '';

    // Portrait bar — positioned inside the game container at the bottom
    this.portraitBar = document.createElement('div');
    this.portraitBar.className = 'portrait-bar';

    this.playerPortrait = document.createElement('img');
    this.playerPortrait.className = 'portrait portrait-left';
    this.playerPortrait.src = 'character-portrait/michael-and-lud.png';
    this.playerPortrait.alt = 'Ludwig & Michael';
    this.portraitBar.appendChild(this.playerPortrait);

    this.npcPortrait = document.createElement('img');
    this.npcPortrait.className = 'portrait portrait-right';
    this.npcPortrait.alt = 'NPC';
    this.portraitBar.appendChild(this.npcPortrait);

    // Insert into the game container overlay, not the dialog container
    const gameOverlay = document.getElementById('uiOverlay');
    if (gameOverlay) {
      gameOverlay.appendChild(this.portraitBar);
    }

    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'dialog-box';

    this.npcNameEl = document.createElement('div');
    this.npcNameEl.className = 'npc-name';
    this.dialogBox.appendChild(this.npcNameEl);

    this.contentArea = document.createElement('div');
    this.contentArea.className = 'dialog-content';

    this.greetingEl = document.createElement('div');
    this.greetingEl.className = 'greeting-text';
    this.contentArea.appendChild(this.greetingEl);

    this.transcriptArea = document.createElement('div');
    this.transcriptArea.className = 'transcript-area';
    this.transcriptArea.style.display = 'none';
    this.contentArea.appendChild(this.transcriptArea);

    this.dialogBox.appendChild(this.contentArea);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'dialog-status';
    this.statusEl.style.display = 'none';
    this.dialogBox.appendChild(this.statusEl);

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'dialog-buttons';

    this.startConversationBtn = document.createElement('button');
    this.startConversationBtn.textContent = 'Start Conversation';
    this.startConversationBtn.addEventListener('click', () => this.startConversation());
    this.buttonsContainer.appendChild(this.startConversationBtn);

    // Speak button — click to start recording
    this.speakBtn = document.createElement('button');
    this.speakBtn.textContent = 'Speak';
    this.speakBtn.style.display = 'none';
    this.speakBtn.addEventListener('click', () => this._onSpeakClick());
    this.buttonsContainer.appendChild(this.speakBtn);

    // Stop button — click to stop recording and send
    this.stopBtn = document.createElement('button');
    this.stopBtn.textContent = 'Stop & Send';
    this.stopBtn.style.display = 'none';
    this.stopBtn.addEventListener('click', () => this._onStopClick());
    this.buttonsContainer.appendChild(this.stopBtn);

    this.endConversationBtn = document.createElement('button');
    this.endConversationBtn.textContent = 'End';
    this.endConversationBtn.style.display = 'none';
    this.endConversationBtn.addEventListener('click', () => {
      if (this.onEndConversation) this.onEndConversation();
    });
    this.buttonsContainer.appendChild(this.endConversationBtn);

    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = 'Close';
    this.closeBtn.addEventListener('click', () => this._onCloseClick());
    this.buttonsContainer.appendChild(this.closeBtn);

    this.dialogBox.appendChild(this.buttonsContainer);
    this.container.appendChild(this.dialogBox);
  }

  _onCloseClick() {
    if (this._introLines && this._introIndex < this._introLines.length) {
      this._advanceIntro();
    } else {
      this.close();
    }
  }

  _onSpeakClick() {
    if (this._isRecording) return;
    this._isRecording = true;

    // Show stop button, hide speak
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = '';
    this.endConversationBtn.style.display = 'none';
    this.setStatus('● Recording...');

    if (this.onStartRecording) this.onStartRecording();
  }

  _onStopClick() {
    if (!this._isRecording) return;
    this._isRecording = false;

    // Hide stop button, show processing state
    this.stopBtn.style.display = 'none';
    this.setStatus('Processing...');

    if (this.onStopRecording) this.onStopRecording();
  }

  setStatus(text) {
    if (text) {
      this.statusEl.textContent = text;
      this.statusEl.style.display = '';
    } else {
      this.statusEl.style.display = 'none';
    }
  }

  open(npc) {
    this.activeNPC = npc;
    this.isOpen = true;
    this.conversationActive = false;
    this._isRecording = false;

    const context = npc.getContext();
    this.npcNameEl.textContent = context.name;
    this.greetingEl.textContent = context.greeting;
    this.greetingEl.style.display = '';

    this.startConversationBtn.style.display = '';
    this.closeBtn.style.display = '';
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.statusEl.style.display = 'none';

    this.transcriptArea.style.display = 'none';
    this.transcriptArea.innerHTML = '';

    this.dialogBox.style.display = '';
    this.container.classList.add('active');

    // Show portraits if NPC has a portrait
    const npcPortraitSrc = npc.getContext().portrait || npc.config?.portrait;
    if (npcPortraitSrc) {
      // Always show michael-and-lud on the left for NPC conversations
      this.playerPortrait.src = 'character-portrait/michael-and-lud.png';
      this.playerPortrait.style.opacity = '1';
      this.npcPortrait.src = npcPortraitSrc;
      this.npcPortrait.style.opacity = '1';
      this.portraitBar.classList.add('active');
    } else {
      this.portraitBar.classList.remove('active');
    }

    if (this.onOpen) this.onOpen(npc);
  }

  close() {
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;
    this._isRecording = false;
    this.startTime = null;

    // Clear contents but keep the box visible
    this.npcNameEl.textContent = '';
    this.greetingEl.textContent = '';
    this.greetingEl.style.display = 'none';
    this.transcriptArea.style.display = 'none';
    this.transcriptArea.innerHTML = '';
    this.statusEl.style.display = 'none';
    this.startConversationBtn.style.display = 'none';
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.closeBtn.style.display = 'none';

    // Hide portraits
    this.portraitBar.classList.remove('active');

    // Keep container active (visible) but empty
    this.container.classList.add('active');

    if (this.onClose) this.onClose();
  }

  startConversation() {
    this.conversationActive = true;

    this.startConversationBtn.style.display = 'none';
    this.greetingEl.style.display = 'none';

    // Show only Speak button
    this.speakBtn.style.display = '';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';

    this.transcriptArea.style.display = '';
    this.startTime = Date.now();

    if (this.onStartConversation) this.onStartConversation();
  }

  /**
   * Called after processing completes — show Speak and End buttons.
   */
  onSpeakComplete() {
    this.setStatus(null);
    this.speakBtn.style.display = '';
    this.endConversationBtn.style.display = '';
  }

  showMissionResult(understood, autoAdvance) {
    const msgEl = document.createElement('div');
    msgEl.className = 'transcript-entry';
    msgEl.style.marginTop = '6px';

    if (understood) {
      msgEl.style.color = '#2a7d2a';
      msgEl.textContent = '✓ Objective complete!';
    } else if (autoAdvance) {
      msgEl.style.color = '#a05020';
      msgEl.textContent = '— Moving on (3 days consumed) —';
    }

    if (understood || autoAdvance) {
      this.transcriptArea.appendChild(msgEl);
      this.contentArea.scrollTop = this.contentArea.scrollHeight;

      this.speakBtn.style.display = 'none';
      this.stopBtn.style.display = 'none';
      this.endConversationBtn.style.display = 'none';
      this.closeBtn.style.display = '';
    }
  }

  updateTranscript(entry) {
    const entryEl = document.createElement('div');
    entryEl.className = 'transcript-entry ' + entry.role;

    if (entry.role === 'player') {
      entryEl.textContent = 'You: ' + entry.text;
    } else {
      const npcName = this.activeNPC ? this.activeNPC.getContext().name : 'NPC';
      entryEl.textContent = npcName + ': ' + entry.text;
    }

    this.transcriptArea.appendChild(entryEl);
    this.contentArea.scrollTop = this.contentArea.scrollHeight;
  }

  showResults() {
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.closeBtn.style.display = '';

    const doneEl = document.createElement('div');
    doneEl.className = 'transcript-entry';
    doneEl.style.color = '#707070';
    doneEl.style.marginTop = '6px';
    doneEl.textContent = '— Conversation ended —';
    this.transcriptArea.appendChild(doneEl);
    this.contentArea.scrollTop = this.contentArea.scrollHeight;
  }

  showIntro(title, message) {
    this.isOpen = true;
    this.activeNPC = null;
    this.conversationActive = false;

    this.npcNameEl.textContent = title;
    this.greetingEl.textContent = message;
    this.greetingEl.style.display = '';

    this.startConversationBtn.style.display = 'none';
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.closeBtn.style.display = '';
    this.statusEl.style.display = 'none';

    this.transcriptArea.style.display = 'none';
    this.dialogBox.style.display = '';

    this.container.classList.add('active');
    if (this.onOpen) this.onOpen();
  }

  /**
   * Show an intro conversation between Ludwig and Michael.
   * Steps through dialogue lines one at a time with portraits.
   * @param {string} title - Level title
   * @param {Array} lines - Array of { speaker, name, portrait, text }
   * @param {Function} onDone - Called when conversation finishes
   */
  showIntroConversation(title, lines, onDone) {
    this.isOpen = true;
    this.activeNPC = null;
    this.conversationActive = false;
    this._introLines = lines;
    this._introIndex = 0;
    this._introOnDone = onDone;

    this.startConversationBtn.style.display = 'none';
    this.speakBtn.style.display = 'none';
    this.stopBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.statusEl.style.display = 'none';
    this.transcriptArea.style.display = 'none';

    // Set up both portraits — ludwig on left, michael on right
    const ludwigLine = lines.find(l => l.speaker === 'ludwig');
    const michaelLine = lines.find(l => l.speaker === 'michael');
    if (ludwigLine) this.playerPortrait.src = ludwigLine.portrait;
    if (michaelLine) this.npcPortrait.src = michaelLine.portrait;
    this.portraitBar.classList.add('active');

    this._showIntroLine();

    // Close button becomes "Next" during intro
    this.closeBtn.textContent = 'Next ▸';
    this.closeBtn.style.display = '';

    this.dialogBox.style.display = '';
    this.container.classList.add('active');

    if (this.onOpen) this.onOpen();
  }

  /** @private */
  _showIntroLine() {
    const line = this._introLines[this._introIndex];
    if (!line) return;

    this.npcNameEl.textContent = line.name;
    this.greetingEl.textContent = line.text;
    this.greetingEl.style.display = '';

    // Highlight active speaker, dim the other
    if (line.speaker === 'ludwig') {
      this.playerPortrait.style.opacity = '1';
      this.npcPortrait.style.opacity = '0.4';
    } else {
      this.playerPortrait.style.opacity = '0.4';
      this.npcPortrait.style.opacity = '1';
    }
  }

  /** @private */
  _advanceIntro() {
    this._introIndex++;
    if (this._introIndex < this._introLines.length) {
      this._showIntroLine();
    } else {
      // Done — hide portraits, restore close button, then call onDone
      this.portraitBar.classList.remove('active');
      this.playerPortrait.style.opacity = '1';
      this.npcPortrait.style.opacity = '1';

      // Restore close button
      this.closeBtn.textContent = 'Close';

      // Clear intro state
      this._introLines = null;
      this._introIndex = 0;

      // Hide dialog without triggering onClose (we want to show the objective next)
      this.npcNameEl.textContent = '';
      this.greetingEl.textContent = '';
      this.greetingEl.style.display = 'none';
      this.closeBtn.style.display = 'none';
      this.isOpen = false;

      if (this._introOnDone) this._introOnDone();
    }
  }
}

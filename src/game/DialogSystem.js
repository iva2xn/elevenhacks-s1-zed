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
    this.closeBtn.addEventListener('click', () => this.close());
    this.buttonsContainer.appendChild(this.closeBtn);

    this.dialogBox.appendChild(this.buttonsContainer);
    this.container.appendChild(this.dialogBox);
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
      this.npcPortrait.src = npcPortraitSrc;
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

    this.container.classList.remove('active');
    this.portraitBar.classList.remove('active');
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
      msgEl.textContent = '— Moving on (2 days consumed) —';
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
}

/**
 * DialogSystem - Pokémon-style dialog overlay.
 * Fixed-size box below the game. Scrollable transcript.
 * No grades/scores shown — just conversation flow.
 */

export class DialogSystem {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;
    this.startTime = null;
    this.timerInterval = null;

    // Callbacks — set by Game.js
    this.onOpen = null;
    this.onClose = null;
    this.onStartConversation = null;
    this.onSpeak = null;
    this.onEndConversation = null;
    this.onResultsDismissed = null;

    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = '';

    // Main dialog box
    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'dialog-box';

    // NPC name
    this.npcNameEl = document.createElement('div');
    this.npcNameEl.className = 'npc-name';
    this.dialogBox.appendChild(this.npcNameEl);

    // Content area — fixed height, scrollable
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'dialog-content';

    // Greeting text
    this.greetingEl = document.createElement('div');
    this.greetingEl.className = 'greeting-text';
    this.contentArea.appendChild(this.greetingEl);

    // Transcript area (initially hidden)
    this.transcriptArea = document.createElement('div');
    this.transcriptArea.className = 'transcript-area';
    this.transcriptArea.style.display = 'none';
    this.contentArea.appendChild(this.transcriptArea);

    this.dialogBox.appendChild(this.contentArea);

    // Buttons
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'dialog-buttons';

    this.startConversationBtn = document.createElement('button');
    this.startConversationBtn.textContent = 'Start Conversation';
    this.startConversationBtn.addEventListener('click', () => this.startConversation());
    this.buttonsContainer.appendChild(this.startConversationBtn);

    this.speakBtn = document.createElement('button');
    this.speakBtn.textContent = 'Speak';
    this.speakBtn.style.display = 'none';
    this.speakBtn.addEventListener('click', () => {
      if (this.onSpeak) this.onSpeak();
    });
    this.buttonsContainer.appendChild(this.speakBtn);

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

  open(npc) {
    this.activeNPC = npc;
    this.isOpen = true;
    this.conversationActive = false;

    const context = npc.getContext();
    this.npcNameEl.textContent = context.name;
    this.greetingEl.textContent = context.greeting;
    this.greetingEl.style.display = '';

    this.startConversationBtn.style.display = '';
    this.closeBtn.style.display = '';
    this.speakBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';

    this.transcriptArea.style.display = 'none';
    this.transcriptArea.innerHTML = '';

    this.dialogBox.style.display = '';
    this.container.classList.add('active');

    if (this.onOpen) this.onOpen(npc);
  }

  close() {
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.startTime = null;

    this.container.classList.remove('active');
    if (this.onClose) this.onClose();
  }

  startConversation() {
    this.conversationActive = true;

    this.startConversationBtn.style.display = 'none';
    this.greetingEl.style.display = 'none';

    this.speakBtn.style.display = '';
    this.endConversationBtn.style.display = '';
    this.transcriptArea.style.display = '';

    this.startTime = Date.now();

    if (this.onStartConversation) this.onStartConversation();
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

  updateTimer() {}

  /**
   * End conversation — just show a simple "done" message, no grades.
   */
  showResults(scoreData) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Hide speak/end buttons, show close
    this.speakBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';
    this.closeBtn.style.display = '';

    // Add a completion message to the transcript
    const doneEl = document.createElement('div');
    doneEl.className = 'transcript-entry';
    doneEl.style.color = '#d4a017';
    doneEl.style.marginTop = '6px';
    doneEl.textContent = '— Conversation ended —';
    this.transcriptArea.appendChild(doneEl);
    this.contentArea.scrollTop = this.contentArea.scrollHeight;

    if (this.onResultsDismissed) this.onResultsDismissed();
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
    this.endConversationBtn.style.display = 'none';
    this.closeBtn.style.display = '';

    this.transcriptArea.style.display = 'none';
    this.dialogBox.style.display = '';

    this.container.classList.add('active');
    if (this.onOpen) this.onOpen();
  }
}

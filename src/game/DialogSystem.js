/**
 * DialogSystem - HTML overlay for NPC dialogue and conversation UI.
 *
 * This is a purely UI component. Game.js wires the callbacks to connect
 * it with ConversationSystem and ScoringSystem.
 */

export class DialogSystem {
  /**
   * @param {HTMLElement} container - The dialog container element (#dialogContainer)
   */
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;
    this.startTime = null;
    this.timerInterval = null;

    // Callbacks — set by Game.js
    /** @type {Function|null} */
    this.onOpen = null;
    /** @type {Function|null} */
    this.onClose = null;
    /** @type {Function|null} */
    this.onStartConversation = null;
    /** @type {Function|null} */
    this.onSpeak = null;
    /** @type {Function|null} */
    this.onEndConversation = null;
    /** @type {Function|null} */
    this.onResultsDismissed = null;

    // Build DOM structure
    this._buildDOM();

    // Initially hidden
    this.container.style.display = 'none';
  }

  /**
   * Build all dialog DOM elements programmatically inside the container.
   * @private
   */
  _buildDOM() {
    // Clear any existing content
    this.container.innerHTML = '';

    // --- Main dialog box ---
    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'dialog-box';

    // NPC name header
    this.npcNameEl = document.createElement('div');
    this.npcNameEl.className = 'npc-name';
    this.dialogBox.appendChild(this.npcNameEl);

    // Greeting text
    this.greetingEl = document.createElement('div');
    this.greetingEl.className = 'greeting-text';
    this.dialogBox.appendChild(this.greetingEl);

    // Transcript area (initially hidden)
    this.transcriptArea = document.createElement('div');
    this.transcriptArea.className = 'transcript-area';
    this.transcriptArea.style.display = 'none';
    this.dialogBox.appendChild(this.transcriptArea);

    // Timer display (initially hidden)
    this.timerEl = document.createElement('div');
    this.timerEl.className = 'timer';
    this.timerEl.textContent = '00:00';
    this.timerEl.style.display = 'none';
    this.dialogBox.appendChild(this.timerEl);

    // Buttons container
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'dialog-buttons';

    // Start Conversation button
    this.startConversationBtn = document.createElement('button');
    this.startConversationBtn.textContent = 'Start Conversation';
    this.startConversationBtn.addEventListener('click', () => this.startConversation());
    this.buttonsContainer.appendChild(this.startConversationBtn);

    // Speak button (initially hidden)
    this.speakBtn = document.createElement('button');
    this.speakBtn.textContent = 'Speak';
    this.speakBtn.style.display = 'none';
    this.speakBtn.addEventListener('click', () => {
      if (this.onSpeak) this.onSpeak();
    });
    this.buttonsContainer.appendChild(this.speakBtn);

    // End Conversation button (initially hidden)
    this.endConversationBtn = document.createElement('button');
    this.endConversationBtn.textContent = 'End Conversation';
    this.endConversationBtn.style.display = 'none';
    this.endConversationBtn.addEventListener('click', () => {
      if (this.onEndConversation) this.onEndConversation();
    });
    this.buttonsContainer.appendChild(this.endConversationBtn);

    // Close button
    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = 'Close';
    this.closeBtn.addEventListener('click', () => this.close());
    this.buttonsContainer.appendChild(this.closeBtn);

    this.dialogBox.appendChild(this.buttonsContainer);
    this.container.appendChild(this.dialogBox);

    // --- Results screen overlay ---
    this.resultsScreen = document.createElement('div');
    this.resultsScreen.className = 'results-screen';
    this.resultsScreen.style.display = 'none';

    this.resultsContent = document.createElement('div');
    this.resultsContent.className = 'results-content';
    this.resultsScreen.appendChild(this.resultsContent);

    this.container.appendChild(this.resultsScreen);
  }

  /**
   * Show the dialog overlay with NPC greeting.
   * @param {NPC} npc
   */
  open(npc) {
    this.activeNPC = npc;
    this.isOpen = true;
    this.conversationActive = false;

    // Set NPC name and greeting
    const context = npc.getContext();
    this.npcNameEl.textContent = context.name;
    this.greetingEl.textContent = context.greeting;

    // Show "Start Conversation" and "Close" buttons
    this.startConversationBtn.style.display = '';
    this.closeBtn.style.display = '';

    // Hide "Speak" and "End Conversation" buttons
    this.speakBtn.style.display = 'none';
    this.endConversationBtn.style.display = 'none';

    // Hide transcript area and timer
    this.transcriptArea.style.display = 'none';
    this.transcriptArea.innerHTML = '';
    this.timerEl.style.display = 'none';
    this.timerEl.textContent = '00:00';

    // Hide results screen
    this.resultsScreen.style.display = 'none';

    // Show dialog box
    this.dialogBox.style.display = '';

    // Show the container
    this.container.style.display = 'block';
    this.container.classList.add('active');

    if (this.onOpen) this.onOpen(npc);
  }

  /**
   * Hide the overlay, reset state.
   */
  close() {
    this.isOpen = false;
    this.activeNPC = null;
    this.conversationActive = false;

    // Stop timer if running
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.startTime = null;

    // Hide everything
    this.container.style.display = 'none';
    this.container.classList.remove('active');

    if (this.onClose) this.onClose();
  }

  /**
   * Begin a conversation session.
   * Hides "Start Conversation", shows "Speak" and "End Conversation",
   * shows transcript area and timer, starts the timer interval.
   */
  startConversation() {
    this.conversationActive = true;

    // Hide "Start Conversation" button
    this.startConversationBtn.style.display = 'none';

    // Show "Speak" and "End Conversation" buttons
    this.speakBtn.style.display = '';
    this.endConversationBtn.style.display = '';

    // Show transcript area and timer
    this.transcriptArea.style.display = '';
    this.timerEl.style.display = '';

    // Start timer
    this.startTime = Date.now();
    this.timerEl.textContent = '00:00';

    this.timerInterval = setInterval(() => {
      if (this.startTime !== null) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateTimer(elapsed);
      }
    }, 1000);

    if (this.onStartConversation) this.onStartConversation();
  }

  /**
   * Append a new line to the transcript display.
   * @param {{ role: 'player'|'npc', text: string }} entry
   */
  updateTranscript(entry) {
    const entryEl = document.createElement('div');
    entryEl.className = 'transcript-entry ' + entry.role;

    if (entry.role === 'player') {
      entryEl.textContent = 'You: ' + entry.text;
    } else {
      // Use NPC name if available
      const npcName = this.activeNPC
        ? this.activeNPC.getContext().name
        : 'NPC';
      entryEl.textContent = npcName + ': ' + entry.text;
    }

    this.transcriptArea.appendChild(entryEl);

    // Auto-scroll to bottom
    this.transcriptArea.scrollTop = this.transcriptArea.scrollHeight;
  }

  /**
   * Update the timer display in MM:SS format.
   * @param {number} elapsed - Elapsed time in seconds
   */
  updateTimer(elapsed) {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    this.timerEl.textContent = mm + ':' + ss;
  }

  /**
   * Display the scoring results screen.
   * @param {object} scoreData - ScoreResult from ScoringSystem
   */
  showResults(scoreData) {
    // Stop the timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Hide the dialog box
    this.dialogBox.style.display = 'none';

    // Build results content
    this.resultsContent.innerHTML = '';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Conversation Results';
    title.style.marginBottom = '8px';
    this.resultsContent.appendChild(title);

    // Star rating
    const starDiv = document.createElement('div');
    starDiv.className = 'star-rating';
    starDiv.textContent = '★'.repeat(scoreData.starRating) + '☆'.repeat(5 - scoreData.starRating);
    this.resultsContent.appendChild(starDiv);

    // Dimension scores
    const dimensions = document.createElement('div');
    dimensions.className = 'score-dimensions';

    const dimensionLabels = {
      fluency: 'Fluency',
      pronunciation: 'Pronunciation',
      naturalness: 'Naturalness',
      vocabulary: 'Vocabulary',
      grammar: 'Grammar',
      nativeLikeness: 'Native-likeness'
    };

    for (const [key, label] of Object.entries(dimensionLabels)) {
      const dimEl = document.createElement('div');
      dimEl.textContent = label + ': ' + Math.round(scoreData[key]);
      dimensions.appendChild(dimEl);
    }

    this.resultsContent.appendChild(dimensions);

    // Quality score
    const qualityEl = document.createElement('div');
    qualityEl.style.marginTop = '8px';
    qualityEl.textContent = 'Quality Score: ' + Math.round(scoreData.qualityScore);
    this.resultsContent.appendChild(qualityEl);

    // Final score
    const finalEl = document.createElement('div');
    finalEl.textContent = 'Final Score: ' + Math.round(scoreData.finalScore);
    finalEl.style.fontWeight = 'bold';
    this.resultsContent.appendChild(finalEl);

    // Conversation duration
    const durationEl = document.createElement('div');
    durationEl.style.marginTop = '4px';
    durationEl.style.fontSize = '12px';
    durationEl.style.color = '#aaa';
    const mins = Math.floor(scoreData.conversationTime / 60);
    const secs = Math.floor(scoreData.conversationTime % 60);
    durationEl.textContent = 'Duration: ' +
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    this.resultsContent.appendChild(durationEl);

    // Continue / dismiss button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.marginTop = '12px';
    continueBtn.style.padding = '6px 14px';
    continueBtn.style.border = '1px solid #e6c84c';
    continueBtn.style.background = 'transparent';
    continueBtn.style.color = '#e6c84c';
    continueBtn.style.cursor = 'pointer';
    continueBtn.style.borderRadius = '4px';
    continueBtn.style.fontSize = '13px';
    continueBtn.addEventListener('click', () => {
      if (this.onResultsDismissed) this.onResultsDismissed();
      this.close();
    });
    this.resultsContent.appendChild(continueBtn);

    // Show results screen
    this.resultsScreen.style.display = '';
  }
}

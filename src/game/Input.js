/**
 * Input - Captures keyboard and touch input.
 * Exposes a polling interface for the game loop.
 */
export class Input {
  constructor() {
    /** @type {Record<string, boolean>} Currently held keys */
    this.keys = {};

    /** Touch d-pad state */
    this.touchDx = 0;
    this.touchDy = 0;

    /** Touch interact state (edge-triggered) */
    this.touchInteract = false;

    /** Whether input processing is enabled */
    this.enabled = true;

    /**
     * Edge-triggered interact tracking.
     * _interactPressed is set true on keydown for Space/Enter.
     * _interactConsumed ensures it only fires once per press.
     */
    this._interactPressed = false;
    this._interactConsumed = false;

    // Bind handlers so we can remove them if needed
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  /**
   * Attach keydown/keyup listeners for arrow keys, WASD, Space, and Enter.
   */
  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  /**
   * @param {KeyboardEvent} e
   * @private
   */
  _onKeyDown(e) {
    const key = e.key;

    // Prevent default scrolling for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(key)) {
      e.preventDefault();
    }

    this.keys[key] = true;

    // Edge-trigger interact on first keydown (not repeat)
    if ((key === ' ' || key === 'Enter') && !e.repeat) {
      this._interactPressed = true;
      this._interactConsumed = false;
    }
  }

  /**
   * @param {KeyboardEvent} e
   * @private
   */
  _onKeyUp(e) {
    this.keys[e.key] = false;

    // Reset interact edge-trigger state on key release
    if (e.key === ' ' || e.key === 'Enter') {
      this._interactPressed = false;
      this._interactConsumed = false;
    }
  }

  /**
   * Poll current input state.
   * dx/dy are -1, 0, or +1 based on held keys or touch d-pad.
   * interact is true only on the frame it was first pressed (edge-triggered).
   *
   * @returns {{ dx: number, dy: number, interact: boolean }}
   */
  poll() {
    if (!this.enabled) {
      return { dx: 0, dy: 0, interact: false };
    }

    // Compute dx from keyboard
    let dx = 0;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      dx = -1;
    } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      dx = 1;
    }

    // Compute dy from keyboard
    let dy = 0;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      dy = -1;
    } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      dy = 1;
    }

    // Apply touch d-pad (touch overrides keyboard if active)
    if (this.touchDx !== 0) dx = this.touchDx;
    if (this.touchDy !== 0) dy = this.touchDy;

    // Edge-triggered interact: true only on the first poll after press
    let interact = false;
    if (this._interactPressed && !this._interactConsumed) {
      interact = true;
      this._interactConsumed = true;
    }

    // Touch interact is already edge-triggered (set on tap, consumed here)
    if (this.touchInteract) {
      interact = true;
      this.touchInteract = false;
    }

    return { dx, dy, interact };
  }

  /**
   * Check if interact was pressed this frame.
   * @returns {boolean}
   */
  get isInteracting() {
    return this._interactPressed && !this._interactConsumed;
  }

  /**
   * Enable or disable input processing.
   * When disabled, poll() returns { dx: 0, dy: 0, interact: false }.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Detect if the device supports touch input.
   * @returns {boolean}
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Create on-screen touch controls: a d-pad (4 directional buttons) and
   * an interact button. Appends to the given container element.
   *
   * The HTML structure matches the CSS classes in styles.css:
   *   #touchControls.active > .dpad > button.dpad-btn
   *   #touchControls.active > .interact-btn
   *
   * @param {HTMLElement} container - The touch controls container element
   */
  createTouchControls(container) {
    // Show the touch controls container
    container.classList.add('active');

    // --- D-pad ---
    const dpad = document.createElement('div');
    dpad.className = 'dpad';

    // D-pad layout is a 3x3 grid:
    //   [empty] [  up  ] [empty]
    //   [ left] [empty ] [right]
    //   [empty] [ down ] [empty]
    const layout = [
      { label: '▲', dx: 0, dy: -1, pos: 'up' },     // row 0, col 1
      { label: '◄', dx: -1, dy: 0, pos: 'left' },    // row 1, col 0
      { label: '►', dx: 1, dy: 0, pos: 'right' },    // row 1, col 2
      { label: '▼', dx: 0, dy: 1, pos: 'down' },     // row 2, col 1
    ];

    // Build the 3x3 grid cells
    const gridPositions = [
      null, 'up', null,
      'left', null, 'right',
      null, 'down', null
    ];

    for (const pos of gridPositions) {
      if (pos === null) {
        // Empty cell
        const empty = document.createElement('div');
        empty.className = 'empty';
        dpad.appendChild(empty);
      } else {
        const dir = layout.find(d => d.pos === pos);
        const btn = document.createElement('button');
        btn.className = 'dpad-btn';
        btn.textContent = dir.label;
        btn.setAttribute('data-dir', pos);

        // Set dx/dy on touchstart, clear on touchend/touchcancel
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.touchDx = dir.dx;
          this.touchDy = dir.dy;
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.touchDx = 0;
          this.touchDy = 0;
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          this.touchDx = 0;
          this.touchDy = 0;
        }, { passive: false });

        dpad.appendChild(btn);
      }
    }

    container.appendChild(dpad);

    // --- Interact button ---
    const interactBtn = document.createElement('button');
    interactBtn.className = 'interact-btn';
    interactBtn.textContent = 'Talk';

    interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchInteract = true;
    }, { passive: false });

    container.appendChild(interactBtn);
  }
}

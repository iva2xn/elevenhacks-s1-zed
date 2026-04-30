import { Game } from './game/Game.js';

const canvas = document.getElementById('gameCanvas');

if (!canvas) {
  console.error('Could not find #gameCanvas element');
} else {
  const game = new Game(canvas);

  // Wire up mobile controls if touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
      mobileControls.classList.add('active');

      const dpadBtns = mobileControls.querySelectorAll('.dpad-btn');
      for (const btn of dpadBtns) {
        const dir = btn.getAttribute('data-dir');
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (dir === 'up') game.input.touchDy = -1;
          else if (dir === 'down') game.input.touchDy = 1;
          else if (dir === 'left') game.input.touchDx = -1;
          else if (dir === 'right') game.input.touchDx = 1;
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          if (dir === 'up' || dir === 'down') game.input.touchDy = 0;
          else game.input.touchDx = 0;
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          if (dir === 'up' || dir === 'down') game.input.touchDy = 0;
          else game.input.touchDx = 0;
        }, { passive: false });
      }

      const interactBtn = mobileControls.querySelector('.interact-btn');
      if (interactBtn) {
        interactBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          game.input.touchInteract = true;
        }, { passive: false });
      }
    }
  }

  game.start().catch(err => {
    console.error('Game failed to start:', err);
  });
}

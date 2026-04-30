import { Game } from './game/Game.js';

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  console.error('Could not find #gameCanvas element');
} else {
  const game = new Game(canvas);
  game.start().catch(err => {
    console.error('Game failed to start:', err);
  });
}

import { CONFIG } from './Config.js';

/**
 * NPC context data for each known NPC identifier.
 */
export const NPC_CONFIGS = {
  Motorcycle_Rider: {
    name: '摩托车骑手',
    greeting: '嘿，朋友！你也喜欢骑摩托车吗？这条路风景很好！',
    personality: 'A friendly and outgoing local motorcycle rider who loves cruising the streets.',
    scenario: 'The player encounters a motorcycle rider taking a break by the roadside.',
    portrait: 'character-portrait/day1-npc.png'
  },
  Motorcycle_Rider_2: {
    name: '摩托车手小李',
    greeting: '你好！我刚从城里过来，路上堵车堵得厉害。',
    personality: 'A slightly more reserved motorcycle rider who is practical and informative.',
    scenario: 'The player meets a second motorcycle rider who just arrived from the city.',
    portrait: 'character-portrait/day1-npc.png'
  },
  TimeWaste: {
    name: '闲聊大叔',
    greeting: '哎呀，你不忙吧？来来来，咱们聊会儿天！',
    personality: 'A talkative older man who loves to chat about anything and everything.',
    scenario: 'The player encounters a chatty local who wants to pass the time with conversation.',
    portrait: 'character-portrait/day1-npc.png'
  },
  Door_Shopkeeper: {
    name: '店员小姐',
    greeting: '欢迎光临！请问您需要什么？',
    personality: 'A friendly young shopkeeper who is helpful and patient with foreigners.',
    scenario: 'The player enters a store and needs to ask the shopkeeper for a compass.',
    portrait: 'character-portrait/day1-npc.png'
  }
};

/** Sprite image paths for NPCs that have custom art. */
const NPC_SPRITES = {
  Motorcycle_Rider: 'npc/d1/d1-rider1.png',
  Motorcycle_Rider_2: 'npc/d1/d1-rider2.png'
};

/** Fallback colors for NPCs without sprites. */
const NPC_COLORS = {
  Motorcycle_Rider: '#e74c3c',
  Motorcycle_Rider_2: '#e67e22',
  TimeWaste: '#9b59b6'
};
const DEFAULT_NPC_COLOR = '#3498db';

/**
 * NPC - Non-player character with static position and interaction zone.
 * Renders a sprite image if available, otherwise a colored rectangle.
 */
export class NPC {
  constructor(identifier, x, y, width, height, config) {
    this.identifier = identifier;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.config = config || {};
    this.interactionRange = CONFIG.interaction.range;
    this.showPrompt = false;

    // Load sprite if available
    this.sprite = null;
    this.spriteLoaded = false;
    this.spriteWidth = 64;
    this.spriteHeight = 48;
    const spritePath = NPC_SPRITES[identifier];
    if (spritePath) {
      this.sprite = new Image();
      this.sprite.onload = () => { this.spriteLoaded = true; };
      this.sprite.onerror = () => { console.warn(`NPC: failed to load sprite ${spritePath}`); };
      this.sprite.src = spritePath;
    }
  }

  isInRange(playerX, playerY, range) {
    const effectiveRange = range !== undefined ? range : this.interactionRange;
    const npcCenterX = this.x + this.width / 2;
    const npcCenterY = this.y + this.height / 2;
    const dx = playerX - npcCenterX;
    const dy = playerY - npcCenterY;
    return Math.sqrt(dx * dx + dy * dy) <= effectiveRange;
  }

  draw(ctx, camera) {
    // Use sprite size for visibility check so NPCs don't pop in/out
    const drawW = this.spriteLoaded ? this.spriteWidth : this.width;
    const drawH = this.spriteLoaded ? this.spriteHeight : this.height;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const drawX = centerX - drawW / 2;
    const drawY = centerY - drawH / 2;

    if (!camera.isVisible(drawX, drawY, drawW, drawH)) return;

    if (this.spriteLoaded && this.sprite) {
      // Draw sprite centered on the collision box
      const screen = camera.worldToScreen(
        centerX - this.spriteWidth / 2,
        centerY - this.spriteHeight / 2
      );
      ctx.drawImage(this.sprite, screen.x, screen.y, this.spriteWidth, this.spriteHeight);
    } else {
      // Fallback colored rectangle
      const screen = camera.worldToScreen(this.x, this.y);
      const color = NPC_COLORS[this.identifier] || DEFAULT_NPC_COLOR;
      ctx.fillStyle = color;
      ctx.fillRect(screen.x, screen.y, this.width, this.height);
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x, screen.y, this.width, this.height);
    }

    // Name label above NPC
    const screen = camera.worldToScreen(centerX, this.y);
    const name = this.config.name || this.identifier;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const labelY = this.spriteLoaded
      ? screen.y - (this.spriteHeight - this.height) / 2 - 4
      : screen.y - 4;
    const textWidth = ctx.measureText(name).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(screen.x - textWidth / 2 - 2, labelY - 10, textWidth + 4, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, screen.x, labelY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  getGreeting() { return this.config.greeting || ''; }

  getContext() {
    return {
      identifier: this.identifier,
      name: this.config.name || this.identifier,
      greeting: this.config.greeting || '',
      personality: this.config.personality || '',
      scenario: this.config.scenario || '',
      portrait: this.config.portrait || ''
    };
  }
}

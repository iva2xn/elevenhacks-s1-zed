import { CONFIG } from './Config.js';

/**
 * NPC context data for each known NPC identifier.
 * Maps identifiers to their display name, greeting, personality, and scenario.
 */
export const NPC_CONFIGS = {
  Motorcycle_Rider: {
    name: '摩托车骑手',
    greeting: '嘿，朋友！你也喜欢骑摩托车吗？这条路风景很好！',
    personality: 'A friendly and outgoing local motorcycle rider who loves cruising the streets. Speaks casually and enthusiastically about riding and local roads.',
    scenario: 'The player encounters a motorcycle rider taking a break by the roadside. The rider is happy to chat about directions, local spots, and life on the road.'
  },
  Motorcycle_Rider_2: {
    name: '摩托车手小李',
    greeting: '你好！我刚从城里过来，路上堵车堵得厉害。',
    personality: 'A slightly more reserved motorcycle rider who is practical and informative. Enjoys sharing news and tips about traffic and city life.',
    scenario: 'The player meets a second motorcycle rider who just arrived from the city. He can share information about what is happening in town and give travel advice.'
  },
  TimeWaste: {
    name: '闲聊大叔',
    greeting: '哎呀，你不忙吧？来来来，咱们聊会儿天！',
    personality: 'A talkative older man who loves to chat about anything and everything. He is warm-hearted but tends to ramble and go off on tangents.',
    scenario: 'The player encounters a chatty local who wants to pass the time with conversation. He will talk about the weather, food, neighborhood gossip, and anything else that comes to mind.'
  }
};

/**
 * Color palette for different NPC types when rendering as colored rectangles.
 */
const NPC_COLORS = {
  Motorcycle_Rider: '#e74c3c',
  Motorcycle_Rider_2: '#e67e22',
  TimeWaste: '#9b59b6'
};

const DEFAULT_NPC_COLOR = '#3498db';

/**
 * NPC - Non-player character with static position and interaction zone.
 *
 * Since we don't have NPC sprite sheets, NPCs are rendered as colored
 * rectangles with a name label above them.
 */
export class NPC {
  /**
   * @param {string} identifier - LDtk entity identifier
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} width - Bounding box width
   * @param {number} height - Bounding box height
   * @param {object} config - NPC context { name, greeting, personality, scenario }
   */
  constructor(identifier, x, y, width, height, config) {
    this.identifier = identifier;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.config = config || {};
    this.interactionRange = CONFIG.interaction.range;
    this.showPrompt = false;
  }

  /**
   * Check if the player is within interaction range using center-to-center distance.
   * @param {number} playerX - Player world X position
   * @param {number} playerY - Player world Y position
   * @param {number} [range] - Override range in pixels (default: CONFIG.interaction.range)
   * @returns {boolean} True if the player is within range
   */
  isInRange(playerX, playerY, range) {
    const effectiveRange = range !== undefined ? range : this.interactionRange;

    // Center of the NPC
    const npcCenterX = this.x + this.width / 2;
    const npcCenterY = this.y + this.height / 2;

    const dx = playerX - npcCenterX;
    const dy = playerY - npcCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= effectiveRange;
  }

  /**
   * Draw the NPC as a colored rectangle with a name label.
   * Uses different colors for different NPC types.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Camera} camera - Camera for world-to-screen conversion
   */
  draw(ctx, camera) {
    // Frustum culling — skip if not visible
    if (!camera.isVisible(this.x, this.y, this.width, this.height)) {
      return;
    }

    const screen = camera.worldToScreen(this.x, this.y);
    const color = NPC_COLORS[this.identifier] || DEFAULT_NPC_COLOR;

    // Draw body rectangle
    ctx.fillStyle = color;
    ctx.fillRect(screen.x, screen.y, this.width, this.height);

    // Draw border
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.strokeRect(screen.x, screen.y, this.width, this.height);

    // Draw name label above the NPC
    const name = this.config.name || this.identifier;
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Background for label readability
    const textWidth = ctx.measureText(name).width;
    const labelX = screen.x + this.width / 2;
    const labelY = screen.y - 4;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(labelX - textWidth / 2 - 2, labelY - 10, textWidth + 4, 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, labelX, labelY);

    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  /**
   * Get the NPC greeting text.
   * @returns {string}
   */
  getGreeting() {
    return this.config.greeting || '';
  }

  /**
   * Get the full NPC context object for conversation.
   * @returns {{ identifier: string, name: string, greeting: string, personality: string, scenario: string }}
   */
  getContext() {
    return {
      identifier: this.identifier,
      name: this.config.name || this.identifier,
      greeting: this.config.greeting || '',
      personality: this.config.personality || '',
      scenario: this.config.scenario || ''
    };
  }
}

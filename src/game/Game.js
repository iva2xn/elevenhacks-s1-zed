/**
 * Game - Main orchestrator class.
 *
 * Owns the game loop and all subsystems. Handles level loading, entity
 * management, input processing, NPC/door interaction, dialog wiring,
 * conversation flow, scoring, and level transitions.
 */
import { CONFIG } from './Config.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { LDtkLoader } from './LDtkLoader.js';
import { Collision } from './Collision.js';
import { EntityManager } from './EntityManager.js';
import { DialogSystem } from './DialogSystem.js';
import { ConversationSystem } from './ConversationSystem.js';
import { ScoringSystem } from './ScoringSystem.js';

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Core subsystems
    this.input = new Input();
    this.camera = new Camera(CONFIG.canvas.width, CONFIG.canvas.height);
    this.renderer = new Renderer(canvas, this.ctx);
    this.ldtkLoader = new LDtkLoader();
    this.collision = new Collision();
    this.entityManager = new EntityManager();

    // UI & conversation subsystems
    this.dialogSystem = new DialogSystem(document.getElementById('dialogContainer'));
    this.conversationSystem = new ConversationSystem();
    this.scoringSystem = new ScoringSystem();

    // Game state
    this.isPaused = false;
    this.currentLevel = null;
    this._lastTimestamp = null;

    // Wire dialog callbacks
    this._wireDialogCallbacks();
  }

  /**
   * Initialize systems and start the game loop.
   */
  async start() {
    // Attach keyboard listeners
    this.input.init();

    // Create on-screen touch controls if on a touch device
    if (this.input.isTouchDevice()) {
      const touchContainer = document.getElementById('touchControls');
      if (touchContainer) {
        this.input.createTouchControls(touchContainer);
      }
    }

    // Load the starting level
    await this.loadLevel(CONFIG.levels.startLevel);

    // Begin the game loop
    requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Main game loop tick, called each frame via requestAnimationFrame.
   * @param {number} timestamp - High-resolution timestamp from rAF
   */
  tick(timestamp) {
    // Compute delta time in seconds, cap at 0.1s to prevent huge jumps
    if (this._lastTimestamp === null) {
      this._lastTimestamp = timestamp;
    }
    let dt = (timestamp - this._lastTimestamp) / 1000;
    if (dt > 0.1) dt = 0.1;
    this._lastTimestamp = timestamp;

    if (!this.isPaused) {
      // Poll input
      const input = this.input.poll();

      // Update entities (player movement, follower trailing)
      this.entityManager.update(dt, input, null);

      const player = this.entityManager.player;

      if (player) {
        // Player center for proximity checks
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        // Check NPC proximity — set showPrompt for each NPC
        for (const npc of this.entityManager.npcs) {
          npc.showPrompt = npc.isInRange(
            playerCenterX,
            playerCenterY,
            CONFIG.interaction.range
          );
        }

        // Handle interact input
        if (input.interact) {
          this._handleInteraction(playerCenterX, playerCenterY);
        }

        // Update camera: follow player center, clamp to level bounds
        this.camera.follow(playerCenterX, playerCenterY);
        if (this.currentLevel) {
          this.camera.clamp(this.currentLevel.pxWid, this.currentLevel.pxHei);
        }
      }
    }

    // Render the frame (always render, even when paused, so the scene stays visible)
    this.renderer.render(this.camera, this.currentLevel, {
      player: this.entityManager.player,
      follower: this.entityManager.follower,
      npcs: this.entityManager.npcs,
      doors: this.entityManager.doors
    });

    // Request next frame
    requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Handle interact input — check for nearby NPC first, then nearby door.
   * @param {number} playerCenterX
   * @param {number} playerCenterY
   * @private
   */
  _handleInteraction(playerCenterX, playerCenterY) {
    const range = CONFIG.interaction.range;

    // Check NPCs first
    for (const npc of this.entityManager.npcs) {
      if (npc.isInRange(playerCenterX, playerCenterY, range)) {
        this.dialogSystem.open(npc);
        return;
      }
    }

    // Then check doors
    for (const door of this.entityManager.doors) {
      const doorCenterX = door.x + door.width / 2;
      const doorCenterY = door.y + door.height / 2;
      const dx = playerCenterX - doorCenterX;
      const dy = playerCenterY - doorCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= range) {
        if (door.targetLevel) {
          this.transitionToLevel(door.targetLevel, door.targetSpawn);
        } else {
          console.warn('Door has no targetLevel field — ignoring interaction.');
        }
        return;
      }
    }
  }

  /**
   * Load a level by its identifier.
   *
   * Fetches the .ldtkl file, loads PNG layer images, sets the collision grid,
   * and spawns entities.
   *
   * @param {string} levelId - e.g. "Level_1"
   */
  async loadLevel(levelId) {
    const levelFileUrl = CONFIG.levels.levelFiles[levelId];
    if (!levelFileUrl) {
      console.error(`Game: No level file configured for "${levelId}"`);
      return;
    }

    console.log(`Game: Loading level "${levelId}" from "${levelFileUrl}"...`);

    // Parse the LDtk level file
    const parsedLevel = await this.ldtkLoader.loadLevel(levelFileUrl);
    console.log(`Game: Parsed level "${parsedLevel.identifier}" (${parsedLevel.pxWid}x${parsedLevel.pxHei}), ${parsedLevel.entities.length} entities, collision grid: ${parsedLevel.gridCols}x${parsedLevel.gridRows}`);

    // Load PNG layer images for this level
    await this.renderer.loadLevelImages(levelId, Renderer.LAYER_ORDER);
    console.log(`Game: Loaded ${this.renderer.layerImages.size} PNG layer images`);

    // Set collision grid
    this.collision.setGrid(
      parsedLevel.collisionGrid,
      parsedLevel.gridSize,
      parsedLevel.gridCols,
      parsedLevel.gridRows
    );

    // Spawn entities from level data
    this.entityManager.spawnFromLevel(parsedLevel, this.collision);

    // Store as current level
    this.currentLevel = parsedLevel;
  }

  /**
   * Transition to a new level, optionally spawning the player at a named spawn point.
   *
   * @param {string} targetLevel - Level identifier to load (e.g. "Level_2")
   * @param {string} [targetSpawn] - Entity identifier to spawn the player at
   */
  async transitionToLevel(targetLevel, targetSpawn) {
    // Clear current entities
    this.entityManager.clear();

    // Load the new level
    await this.loadLevel(targetLevel);

    // If a target spawn is specified, find the matching entity and reposition the player
    if (targetSpawn && this.currentLevel) {
      const spawnEntity = this.currentLevel.entities.find(
        (e) => e.identifier === targetSpawn
      );
      if (spawnEntity && this.entityManager.player) {
        this.entityManager.player.x = spawnEntity.px[0];
        this.entityManager.player.y = spawnEntity.px[1];
      }
    }
  }

  /**
   * Wire all dialog system callbacks to connect DialogSystem with
   * ConversationSystem, ScoringSystem, and game state.
   * @private
   */
  _wireDialogCallbacks() {
    // When dialog opens: pause game, disable input
    this.dialogSystem.onOpen = () => {
      this.isPaused = true;
      this.input.setEnabled(false);
    };

    // When dialog closes: resume game, re-enable input
    this.dialogSystem.onClose = () => {
      this.isPaused = false;
      this.input.setEnabled(true);
    };

    // When "Start Conversation" is clicked: begin a conversation session
    this.dialogSystem.onStartConversation = () => {
      const npc = this.dialogSystem.activeNPC;
      if (npc) {
        this.conversationSystem.startSession(npc.getContext());
      }
    };

    // When "Speak" is clicked: capture speech and get NPC response
    this.dialogSystem.onSpeak = async () => {
      const entries = await this.conversationSystem.captureAndRespond();
      if (entries) {
        for (const entry of entries) {
          this.dialogSystem.updateTranscript(entry);
        }
      }
    };

    // When "End Conversation" is clicked: end session, score, show results
    this.dialogSystem.onEndConversation = async () => {
      // Capture elapsed time BEFORE ending the session (endSession resets startTime)
      const conversationTime = this.dialogSystem.startTime
        ? (Date.now() - this.dialogSystem.startTime) / 1000
        : this.conversationSystem.getElapsedTime();

      const transcript = this.conversationSystem.endSession();

      const scoreResult = await this.scoringSystem.evaluate(transcript, conversationTime);
      this.dialogSystem.showResults(scoreResult);
    };

    // Results dismissed is handled by the close callback (dialog closes itself)
    this.dialogSystem.onResultsDismissed = () => {
      // The close() call in DialogSystem handles resuming the game
    };
  }
}

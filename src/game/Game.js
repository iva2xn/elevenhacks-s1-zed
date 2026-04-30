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

    // Center camera on player immediately so first frame isn't at (0,0)
    const player = this.entityManager.player;
    if (player) {
      this.camera.follow(player.x + player.width / 2, player.y + player.height / 2);
      this.camera.clamp(parsedLevel.pxWid, parsedLevel.pxHei);
    }

    // Show level intro dialog if configured
    const intro = CONFIG.levels.intros && CONFIG.levels.intros[levelId];
    if (intro) {
      this.dialogSystem.showIntro(intro.title, intro.message);
    }
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
    this.dialogSystem.onOpen = () => {
      this.isPaused = true;
      this.input.setEnabled(false);
    };

    this.dialogSystem.onClose = () => {
      this.isPaused = false;
      this.input.setEnabled(true);
    };

    // Start conversation with mission context
    this.dialogSystem.onStartConversation = () => {
      const npc = this.dialogSystem.activeNPC;
      if (npc) {
        const levelId = this.currentLevel ? this.currentLevel.identifier : '';
        const mission = CONFIG.levels.missions && CONFIG.levels.missions[levelId];
        this.conversationSystem.startSession(npc.getContext(), mission);
      }
    };

    // Start recording
    this.dialogSystem.onStartRecording = () => {
      this.conversationSystem.startRecording();
    };

    // Stop recording, process, evaluate
    this.dialogSystem.onStopRecording = async () => {
      const result = await this.conversationSystem.stopAndProcess();
      if (!result) return;

      for (const entry of result.entries) {
        this.dialogSystem.updateTranscript(entry);
      }

      this.dialogSystem.onSpeakComplete();

      // Mission complete or auto-advance → show transition screen
      if (result.understood || result.autoAdvance) {
        this.dialogSystem.showMissionResult(result.understood, result.autoAdvance);

        // After a short delay, show the transition screen
        const levelId = this.currentLevel ? this.currentLevel.identifier : '';
        const mission = CONFIG.levels.missions && CONFIG.levels.missions[levelId];
        if (mission) {
          const days = result.understood ? mission.successDays : mission.failDays;
          setTimeout(() => {
            this.dialogSystem.close();
            this._showTransition(mission.cityName, mission.cityNameEnglish, days);
          }, 2000);
        }
      }
    };

    // End conversation
    this.dialogSystem.onEndConversation = () => {
      this.conversationSystem.endSession();
      this.dialogSystem.showResults();
    };
  }

  /**
   * Show the transition screen between levels.
   */
  _showTransition(cityName, cityNameEnglish, days) {
    const screen = document.getElementById('transitionScreen');
    const cityEl = document.getElementById('transitionCity');
    const timeEl = document.getElementById('transitionTime');
    const btn = document.getElementById('transitionContinue');

    cityEl.innerHTML = `You arrived at:<br><br><span style="font-size:24px">${cityName}</span><br><span style="font-size:12px">${cityNameEnglish}</span>`;
    timeEl.textContent = `Time spent: ${days} day${days > 1 ? 's' : ''}`;

    screen.classList.add('active');

    // Wire continue button to load next level
    const handler = async () => {
      btn.removeEventListener('click', handler);
      screen.classList.remove('active');

      // Determine next level
      const currentId = this.currentLevel ? this.currentLevel.identifier : 'Level_1';
      const levelNum = parseInt(currentId.replace('Level_', ''), 10);
      const nextId = 'Level_' + (levelNum + 1);

      if (CONFIG.levels.levelFiles[nextId]) {
        await this.transitionToLevel(nextId);
      } else {
        // No more levels — show a final message
        this.dialogSystem.showIntro('The End', 'You have completed all stages. Great job practicing your Chinese!');
      }
    };

    btn.addEventListener('click', handler);
  }
}

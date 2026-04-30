/**
 * Global configuration object for the Chinese RPG game.
 * All tunable constants and settings are defined here.
 */
export const CONFIG = {
  canvas: {
    width: 672,
    height: 320
  },
  player: {
    speed: 100, // pixels per second
    spriteConfig: {
      imageSrc: '',
      frameWidth: 16,
      frameHeight: 16,
      frameCount: 4,
      animRowMap: { down: 0, left: 1, right: 2, up: 3 },
      animSpeed: 0.15 // seconds per frame
    }
  },
  follower: {
    followDelay: 15, // steps behind player (higher = more distance)
    spriteConfig: {
      imageSrc: '',
      frameWidth: 16,
      frameHeight: 16,
      frameCount: 4,
      animRowMap: { down: 0, left: 1, right: 2, up: 3 },
      animSpeed: 0.15
    }
  },
  interaction: {
    range: 32 // pixels
  },
  scoring: {
    weights: {
      fluency: 0.2,
      pronunciation: 0.2,
      naturalness: 0.15,
      vocabulary: 0.15,
      grammar: 0.2,
      nativeLikeness: 0.1
    },
    timeBaseline: 120, // seconds for 1.0x multiplier
    timeMultiplierMin: 0.5,
    timeMultiplierMax: 1.5
  },
  api: {
    elevenLabsApiKey: '', // Placeholder — never hardcode real keys
    modelId: ''           // Placeholder — set at runtime
  },
  levels: {
    startLevel: 'Level_1',
    levelFiles: {
      'Level_1': 'Level_1.ldtkl',
      'Level_2': 'Level_2.ldtkl'
    }
  },
  png: {
    basePath: 'png',
    layerOrder: [
      'Grass', 'Road', 'Pave', 'Pavedecor',
      'Tree', 'Barrier', 'Truck',
      'Wall', 'Wall_Decor', 'Roof'
    ],
    namingPattern: 'Level_{N}__{LayerName}.png' // Double underscore
  }
};

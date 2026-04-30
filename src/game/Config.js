/**
 * Global configuration object for the Chinese RPG game.
 * All tunable constants and settings are defined here.
 */
export const CONFIG = {
  canvas: {
    width: 320,
    height: 180
  },
  player: {
    speed: 100, // pixels per second
    spriteConfig: {
      basePath: 'character-movement',
      prefix: 'lud',
      frameWidth: 32,
      frameHeight: 32,
      collisionWidth: 14,
      collisionHeight: 14,
      frameCount: 4,
      animSpeed: 0.15 // seconds per frame
    }
  },
  follower: {
    followDelay: 15, // steps behind player (higher = more distance)
    spriteConfig: {
      basePath: 'character-movement',
      prefix: 'michael',
      frameWidth: 32,
      frameHeight: 32,
      collisionWidth: 14,
      collisionHeight: 14,
      frameCount: 4,
      animSpeed: 0.15
    }
  },
  interaction: {
    range: 48 // pixels
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
    },
    intros: {
      'Level_1': {
        title: 'Day 1 — The Street',
        message: 'You just arrived in town. Ask someone how to get to the next town. Use arrow keys or WASD to move, Space to interact.'
      },
      'Level_2': {
        title: 'Day 2 — The Market',
        message: 'Great job yesterday! Today, explore the market area and chat with the locals. Keep practicing!'
      }
    },
    missions: {
      'Level_1': {
        goal: 'Ask someone how to get to the next town',
        keywords: ['下一个', '城镇', '镇', '怎么去', '怎么走', '去哪', '下个', '北', '往北', '方向', '路'],
        keywordsEnglish: ['next town', 'direction', 'how to get', 'which way', 'north', 'where'],
        cityName: '龙泉镇',
        cityNameEnglish: 'Longquan Town',
        successDays: 1,
        failDays: 3
      },
      'Level_2': {
        goal: 'Order food at the restaurant',
        keywords: ['点菜', '吃饭', '菜单', '要一个', '来一份'],
        keywordsEnglish: ['order', 'food', 'menu', 'eat'],
        cityName: '翠竹村',
        cityNameEnglish: 'Cuizhu Village',
        successDays: 1,
        failDays: 3
      }
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

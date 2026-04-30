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
        title: 'Day 1 — Guangzhou',
        message: 'Ask someone how to get to the next town. Use arrow keys or WASD to move, Space to interact.',
        introConversation: [
          { speaker: 'ludwig', name: 'Ludwig', portrait: 'character-portrait/ludwig-portrait.png', text: "Alright Michael, we just landed in Guangzhou. This is it — we're actually in China." },
          { speaker: 'michael', name: 'Michael', portrait: 'character-portrait/michael-portrait.png', text: "Yeah... and I don't speak a word of Chinese. How are we supposed to get around?" },
          { speaker: 'ludwig', name: 'Ludwig', portrait: 'character-portrait/ludwig-portrait.png', text: "That's the whole point! We learn by doing." },
          { speaker: 'michael', name: 'Michael', portrait: 'character-portrait/michael-portrait.png', text: "So... how do you think we get out of this area? Or get to the next destination?" },
          { speaker: 'ludwig', name: 'Ludwig', portrait: 'character-portrait/ludwig-portrait.png', text: "Let's ask our boys over there." }
        ]
      },
      'Level_2': {
        title: 'Day 2 — Gas Station',
        message: 'Find a store and ask for a compass. Look for doors to enter buildings.',
        introConversation: [
          { speaker: 'ludwig', name: 'Ludwig', portrait: 'character-portrait/ludwig-portrait.png', text: "Alright, we just got gas. Tank's full." },
          { speaker: 'michael', name: 'Michael', portrait: 'character-portrait/michael-portrait.png', text: "We should go get a compass from a store or something. We keep getting lost." },
          { speaker: 'ludwig', name: 'Ludwig', portrait: 'character-portrait/ludwig-portrait.png', text: "Good idea. Let's look around for a shop." }
        ]
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
        goal: 'Find a store and ask for a compass',
        keywords: ['指南针', '罗盘', '买', '要', '有没有', '卖', '店', '商店'],
        keywordsEnglish: ['compass', 'buy', 'store', 'shop', 'sell'],
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

// chat gpt session on emotions.
// Can you give me a list of 100 most common human emotions as a javascript array?

var emotions = getEmotions();
let sortedGrid = getSortedGrid(emotions, 'valence', 'arousal');
printSortedGrid(sortedGrid);

function printSortedGrid(grid) {
  grid.forEach(row => console.log(row.join(' ')));
}

function getSortedGrid(emotions, rowSort, columnSort) {
  let grid = [];
  const rowCount = Math.ceil(Math.sqrt(emotions.length));
  const columnCount = Math.ceil(emotions.length / rowCount);

  for (let i = 0; i < rowCount; i++) {
    grid.push([]);
    for (let j = 0; j < columnCount; j++) {
      grid[i].push('');
    }
  }

  emotions.forEach((emotion, index) => {
    const row = Math.floor(index / columnCount);
    const column = index % columnCount;
    grid[row][column] = emotion.emotion;
  });

  return grid;
}

function getEmotions() {
  return [
    {
      "emotion": "anger",
      "valence": -0.8,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "anxiety",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "apathy",
      "valence": -0.5,
      "arousal": -0.5,
      "dominance": -0.9
    },
    {
      "emotion": "disgust",
      "valence": -0.7,
      "arousal": -0.2,
      "dominance": 0.8
    },
    {
      "emotion": "envy",
      "valence": -0.6,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "excitement",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.8
    },
    {
      "emotion": "fear",
      "valence": -0.8,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "frustration",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "gratitude",
      "valence": 0.8,
      "arousal": 0.6,
      "dominance": 0.5
    },
    {
      "emotion": "grief",
      "valence": -0.9,
      "arousal": -0.3,
      "dominance": -0.9
    },
    {
      "emotion": "guilt",
      "valence": -0.7,
      "arousal": 0.7,
      "dominance": 0.9
    },
    {
      "emotion": "happiness",
      "valence": 0.9,
      "arousal": 0.9,
      "dominance": 0.5
    },
    {
      "emotion": "hate",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "hope",
      "valence": 0.8,
      "arousal": 0.7,
      "dominance": 0.8
    },
    {
      "emotion": "humiliation",
      "valence": -0.8,
      "arousal": 0.8,
      "dominance": 1
    },
    {
      "emotion": "hunger",
      "valence": -0.5,
      "arousal": 0.5,
      "dominance": 0.8
    },
    {
      "emotion": "insecurity",
      "valence": -0.6,
      "arousal": 0.7,
      "dominance": 0.9
    },
    {
      "emotion": "inspiration",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.8
    },
    {
      "emotion": "jealousy",
      "valence": -0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "loneliness",
      "valence": -0.7,
      "arousal": -0.7,
      "dominance": -0.9
    },
    {
      "emotion": "love",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.5
    },
    {
      "emotion": "lust",
      "valence": 0.7,
      "arousal": 1,
      "dominance": 0.9
    },
    {
      "emotion": "melancholy",
      "valence": -0.6,
      "arousal": -0.5,
      "dominance": -0.9
    },
    {
      "emotion": "nostalgia",
      "valence": -0.5,
      "arousal": 0.3,
      "dominance": -0.9
    },
    {
      "emotion": "optimism",
      "valence": 0.8,
      "arousal": 0.8,
      "dominance": 0.8
    },
    {
      "emotion": "outrage",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "pain",
      "valence": -0.9,
      "arousal": 0.9,
      "dominance": 1
    },
    {
      "emotion": "passion",
      "valence": 0.8,
      "arousal": 1,
      "dominance": 0.9
    },
    {
      "emotion": "pessimism",
      "valence": -0.8,
      "arousal": -0.7,
      "dominance": -0.9
    },
    {
      "emotion": "pity",
      "valence": -0.6,
      "arousal": -0.3,
      "dominance": -0.9
    },
    {
      "emotion": "pleasure",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.5
    },
    {
      "emotion": "pride",
      "valence": 0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "rage",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "regret",
      "valence": -0.7,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "remorse",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "resentment",
      "valence": -0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "sadness",
      "valence": -0.8,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "satisfaction",
      "valence": 0.8,
      "arousal": 0.7,
      "dominance": 0.5
    },
    {
      "emotion": "shame",
      "valence": -0.9,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "shock",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "stress",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "surprise",
      "valence": 0.5,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "terror",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "trust",
      "valence": 0.7,
      "arousal": 0.5,
      "dominance": 0.5
    },
    {
      "emotion": "uncertainty",
      "valence": -0.6,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "warmth",
      "valence": 0.8,
      "arousal": 0.6,
      "dominance": 0.5
    },
    {
      "emotion": "worry",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "boredom",
      "valence": -0.5,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "calmness",
      "valence": 0.6,
      "arousal": -0.5,
      "dominance": 0.5
    },
    {
      "emotion": "contentment",
      "valence": 0.8,
      "arousal": 0.2,
      "dominance": 0.5
    },
    {
      "emotion": "curiosity",
      "valence": 0.7,
      "arousal": 0.8,
      "dominance": 0.8
    },
    {
      "emotion": "depression",
      "valence": -0.9,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "desire",
      "valence": 0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "disappointment",
      "valence": -0.7,
      "arousal": -0.8,
      "dominance": -0.9
    },
    {
      "emotion": "disbelief",
      "valence": -0.6,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "disillusionment",
      "valence": -0.8,
      "arousal": -0.7,
      "dominance": -0.9
    },
    {
      "emotion": "dread",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "eagerness",
      "valence": 0.7,
      "arousal": 0.9,
      "dominance": 0.8
    },
    {
      "emotion": "ecstasy",
      "valence": 1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "elation",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "embarrassment",
      "valence": -0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "empathy",
      "valence": 0.8,
      "arousal": 0.6,
      "dominance": 0.5
    },
    {
      "emotion": "enthusiasm",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.8
    },
    {
      "emotion": "exasperation",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "exhilaration",
      "valence": 1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "expectation",
      "valence": 0.7,
      "arousal": 0.8,
      "dominance": 0.8
    },
    {
      "emotion": "fascination",
      "valence": 0.8,
      "arousal": 0.9,
      "dominance": 0.8
    },
    {
      "emotion": "fatigue",
      "valence": -0.6,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "fury",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "gloom",
      "valence": -0.8,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "gloominess",
      "valence": -0.8,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "horror",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "hysteria",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "impatience",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "indignation",
      "valence": -0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "interest",
      "valence": 0.7,
      "arousal": 0.8,
      "dominance": 0.8
    },
    {
      "emotion": "irritation",
      "valence": -0.6,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "isolation",
      "valence": -0.7,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "joy",
      "valence": 1,
      "arousal": 1,
      "dominance": 0.8
    },
    {
      "emotion": "longing",
      "valence": -0.7,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "madness",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "miserable",
      "valence": -0.9,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "misery",
      "valence": -0.9,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "numbness",
      "valence": -0.6,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "overwhelming",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "powerlessness",
      "valence": -0.9,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "puzzlement",
      "valence": -0.5,
      "arousal": 0.7,
      "dominance": 0.9
    },
    {
      "emotion": "relief",
      "valence": 0.8,
      "arousal": -0.5,
      "dominance": 0.5
    },
    {
      "emotion": "sarcasm",
      "valence": -0.5,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "scorn",
      "valence": -0.8,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "self-pity",
      "valence": -0.7,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "skepticism",
      "valence": -0.6,
      "arousal": 0.7,
      "dominance": 0.9
    },
    {
      "emotion": "solitude",
      "valence": -0.6,
      "arousal": -0.8,
      "dominance": -0.9
    },
    {
      "emotion": "spite",
      "valence": -0.9,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "stubbornness",
      "valence": -0.7,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "submissiveness",
      "valence": -0.5,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "suffering",
      "valence": -1,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "suspicion",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "tenderness",
      "valence": 0.8,
      "arousal": 0.5,
      "dominance": 0.5
    },
    {
      "emotion": "tension",
      "valence": -0.7,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "terrified",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "thankfulness",
      "valence": 0.8,
      "arousal": 0.6,
      "dominance": 0.5
    },
    {
      "emotion": "thrill",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 0.8
    },
    {
      "emotion": "tiredness",
      "valence": -0.6,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "tolerance",
      "valence": 0.5,
      "arousal": 0.5,
      "dominance": 0.5
    },
    {
      "emotion": "torment",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "triumph",
      "valence": 1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "unhappiness",
      "valence": -0.9,
      "arousal": -1,
      "dominance": -1
    },
    {
      "emotion": "unimportant",
      "valence": -0.5,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "vengefulness",
      "valence": -0.9,
      "arousal": 1,
      "dominance": 0.9
    },
    {
      "emotion": "violence",
      "valence": -1,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "vitality",
      "valence": 0.9,
      "arousal": 1,
      "dominance": 1
    },
    {
      "emotion": "vulnerability",
      "valence": -0.6,
      "arousal": 0.9,
      "dominance": -0.9
    },
    {
      "emotion": "weariness",
      "valence": -0.7,
      "arousal": -0.9,
      "dominance": -0.9
    },
    {
      "emotion": "wickedness",
      "valence": -1,
      "arousal": 0.9,
      "dominance": 0.9
    },
    {
      "emotion": "yearning",
      "valence": -0.7,
      "arousal": 0.8,
      "dominance": 0.9
    },
    {
      "emotion": "zeal",
      "valence": 0.8,
      "arousal": 1,
      "dominance": 0.8
    }
  ];
}


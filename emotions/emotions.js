const emotionsMatrix = [
  ["Joy", "Elation", "Ecstasy", "Rapture", "Bliss", "Euphoria", "Eagerness", "Enthusiasm", "Excitement", "Passion"],
  ["Serenity", "Tranquility", "Peace", "Calm", "Contentment", "Satisfaction", "Relaxation", "Comfort", "Safety", "Satisfaction"],
  ["Surprise", "Interest", "Anticipation", "Hope", "Optimism", "Confidence", "Boldness", "Courage", "Inspiration", "Optimism"],
  ["Fear", "Apprehension", "Worry", "Anxiety", "Unease", "Discomfort", "Distress", "Anguish", "Agony", "Terror"],
  ["Gratitude", "Love", "Affection", "Tenderness", "Fondness", "Sentimentality", "Nostalgia", "Reminiscence", "Appreciation", "Adoration"],
  ["Anger", "Annoyance", "Irritation", "Exasperation", "Frustration", "Impatience", "Pique", "Resentment", "Envy", "Rage"],
  ["Sadness", "Melancholy", "Loneliness", "Nostalgia", "Gloom", "Sorrow", "Grief", "Woe", "Misery", "Despondency"],
  ["Disgust", "Loathing", "Abhorrence", "Scorn", "Contempt", "Revulsion", "Disapproval", "Dislike", "Hatred", "Loathing"],
  ["Amusement", "Pleasure", "Delight", "Glee", "Cheer", "Happiness", "Mirth", "Joyfulness", "Jubilation", "Elation"],
  ["Guilt", "Remorse", "Regret", "Self-reproach", "Shame", "Humiliation", "Embarrassment", "Disgrace", "Mortification", "Contrition"]
];


// List 100 emotions as a javascript array, where each emotion has `name`, `description`,
//  and a few numerical metrics to sort emotions. Such as `energy`, `pleasantness`, 
// `approach vs avoidance`, `self vs other focused`, `activation vs deactivation`, `cognition vs affect`
const emotions = [
  {
      name: "Joy",
      description: "A feeling of great pleasure and happiness.",
      energy: 8,
      pleasantness: 9,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 8,
      cognition_affect: 7
  },
  {
      name: "Elation",
      description: "A feeling of great happiness and triumph.",
      energy: 9,
      pleasantness: 9,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 9,
      cognition_affect: 7
  },
  {
      name: "Ecstasy",
      description: "A feeling of intense pleasure and joy.",
      energy: 10,
      pleasantness: 10,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 10,
      cognition_affect: 7
  },
  {
      name: "Rapture",
      description: "A feeling of intense pleasure and happiness.",
      energy: 9,
      pleasantness: 10,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 9,
      cognition_affect: 7
  },
  {
      name: "Bliss",
      description: "A feeling of perfect happiness and contentment.",
      energy: 8,
      pleasantness: 10,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 8,
      cognition_affect: 7
  },
  {
      name: "Euphoria",
      description: "A feeling of great happiness and well-being.",
      energy: 9,
      pleasantness: 9,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 9,
      cognition_affect: 7
  },
  {
      name: "Eagerness",
      description: "A feeling of keen desire or interest.",
      energy: 8,
      pleasantness: 8,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 8,
      cognition_affect: 7
  },
  {
      name: "Enthusiasm",
      description: "A feeling of great excitement and interest.",
      energy: 9,
      pleasantness: 8,
      approach_avoidance: 9,
      self_other_focused: 7,
      activation_deactivation: 9,
      cognition_affect: 7
  },
    {
        name: "Excitement",
        description: "A feeling of great enthusiasm and energy.",
        energy: 10,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 10,
        cognition_affect: 7
    },
    {
        name: "Passion",
        description: "A strong feeling of enthusiasm or excitement for something.",
        energy: 9,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 9,
        cognition_affect: 7
    },
    {
        name: "Serenity",
        description: "A feeling of calm and peacefulness.",
        energy: 4,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 4,
        cognition_affect: 7
    },
    {
        name: "Tranquility",
        description: "A feeling of calm and peacefulness.",
        energy: 3,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 3,
        cognition_affect: 7
    },
    {
        name: "Peace",
        description: "A feeling of calm and quiet.",
        energy: 2,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 2,
        cognition_affect: 7
    },
    {
        name: "Calm",
        description: "A feeling of peacefulness and composure.",
        energy: 1,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 1,
        cognition_affect: 7
    },
    {
        name: "Contentment",
        description: "A feeling of satisfaction and happiness with one's situation.",
        energy: 4,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 4,
        cognition_affect: 7
    },
    {
        name: "Satisfaction",
        description: "A feeling of pleasure and contentment.",
        energy: 3,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 3,
        cognition_affect: 7
    },
    {
        name: "Relaxation",
        description: "A feeling of calm and ease.",
        energy: 2,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 2,
        cognition_affect: 7
    },
    {
        name: "Comfort",
        description: "A feeling of ease and security.",
        energy: 1,
        pleasantness: 8,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 1,
        cognition_affect: 7
    },
    {
        name: "Safety",
        description: "A feeling of security and protection.",
        energy: 1,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 7,
        activation_deactivation: 1,
        cognition_affect: 7
    },
    {
        name: "Surprise",
        description: "A feeling of mild shock or amazement.",
        energy: 6,
        pleasantness: 5,
        approach_avoidance: 5,
        self_other_focused: 7,
        activation_deactivation: 7,
        cognition_affect: 8
    },
    {
        name: "Interest",
        description: "A feeling of attention and engagement.",
        energy: 6,
        pleasantness: 6,
        approach_avoidance: 6,
        self_other_focused: 7,
        activation_deactivation: 6,
        cognition_affect: 8
    },
    {
        name: "Anticipation",
        description: "A feeling of expectation or excitement about something to come.",
        energy: 7,
        pleasantness: 7,
        approach_avoidance: 8,
        self_other_focused: 7,
        activation_deactivation: 7,
        cognition_affect: 8
    },
    {
        name: "Hope",
        description: "A feeling of expectation and desire for a certain thing to happen.",
        energy: 6,
        pleasantness: 7,
        approach_avoidance: 8,
        self_other_focused: 7,
        activation_deactivation: 6,
        cognition_affect: 8
    },
    {
        name: "Optimism",
        description: "A feeling of hope and confidence about the future.",
        energy: 7,
        pleasantness: 8,
        approach_avoidance: 8,
        self_other_focused: 7,
        activation_deactivation: 7,
        cognition_affect: 8
    },
    {
        name: "Confidence",
        description: "A feeling of trust and belief in oneself.",
        energy: 6,
        pleasantness: 8,
        approach_avoidance: 8,
        self_other_focused: 8,
        activation_deactivation: 6,
        cognition_affect: 8
    },
    {
        name: "Trust",
        description: "A feeling of confidence and reliance in someone or something.",
        energy: 5,
        pleasantness: 8,
        approach_avoidance: 8,
        self_other_focused: 8,
        activation_deactivation: 5,
        cognition_affect: 8
    },
    {
        name: "Love",
        description: "A feeling of strong affection and attachment.",
        energy: 6,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 8,
        activation_deactivation: 6,
        cognition_affect: 8
    },
    {
        name: "Affection",
        description: "A feeling of fondness and tenderness.",
        energy: 5,
        pleasantness: 9,
        approach_avoidance: 9,
        self_other_focused: 8,
        activation_deactivation: 5,
        cognition_affect: 8
    }
]
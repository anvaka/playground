// The vertical axis represents the "energy" level of the emotion, with emotions at the top of the matrix having high energy 
// (e.g. Joy, Excitement, Elation) and emotions at the bottom having low energy (e.g. Calm, Serenity, Contentment).
// The horizontal axis represents the "pleasantness" or valence of the emotion, with emotions on the left having low pleasantness (e.g. Anger, Aggression, Rage) and emotions on the right having high pleasantness (e.g. Joy, Excitement, Elation)
// It's important to note that the pleasantness axis is also called valence, and it represents the degree of positivity or negativity of an emotion.
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

// THe code below iterates over emotions and create rows of buttons in the DOM:
const matrixEl = renderMatrix(emotionsMatrix)
document.querySelector('.emotions-grid .content').appendChild(matrixEl)

function renderMatrix(matrix, xLabel, yLabel) {
    var matrixContainer = document.createElement("div");
    matrixContainer.classList.add("matrix");

    for (var i = 0; i < matrix.length; i++) {

        var row = document.createElement("div");
        row.classList.add("row");

        for (var j = 0; j < matrix[i].length; j++) {
            var button = document.createElement("button");
            button.innerHTML = matrix[i][j];
            button.classList.add("matrix-button");
            row.appendChild(button);
        }
        matrixContainer.appendChild(row);
    }
    return matrixContainer;
}

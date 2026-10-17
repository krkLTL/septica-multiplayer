const game = require("./game");

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const POINT_CARDS = new Set(["A", "10"]);

function normalizeDifficulty(value) {
  const difficulty = String(value || "medium").toLowerCase();
  return DIFFICULTIES.has(difficulty) ? difficulty : "medium";
}

function legalCards(state, player) {
  return state.hands[player].filter(card => game.canPlay(state, player, card));
}

function countCards(hand, value) {
  return hand.reduce((count, card) => count + (game.rankOf(card) === game.rankOf(value) ? 1 : 0), 0);
}

function chooseByPreference(cards, state, player, difficulty) {
  if (!cards.length) return null;
  if (difficulty === "easy") {
    return cards[0];
  }

  const initial = state.sequence[0];
  const preferred = cards.find(card => game.rankOf(card) === "7") || cards.find(card => game.rankOf(card) === game.rankOf(initial));
  if (difficulty === "medium") return preferred || cards[0];

  // Hard preserves the reper when possible and uses a 7 to keep a sequence alive.
  const sameRankCount = countCards(state.hands[player], initial);
  if (preferred && game.rankOf(preferred) === game.rankOf(initial) && sameRankCount > 1) return preferred;
  return preferred || cards.find(card => !POINT_CARDS.has(game.rankOf(card))) || cards[0];
}

function chooseAction(state, player, difficulty = "medium") {
  const level = normalizeDifficulty(difficulty);
  if (!state || state.status !== "playing" || state.turn !== player) {
    return { type: "wait", difficulty: level };
  }

  const cards = legalCards(state, player);
  const canTake = state.sequence.length >= 2 && state.starter === player;

  if (canTake && level !== "easy" && !cards.length) return { type: "take", difficulty: level };
  if (canTake && level === "hard" && state.sequence.length >= 3) {
    return { type: "take", difficulty: level };
  }
  if (canTake && level === "easy" && cards.length === 0) {
    return { type: "take", difficulty: level };
  }

  const card = chooseByPreference(cards, state, player, level);
  return card === null
    ? { type: canTake ? "take" : "wait", difficulty: level }
    : { type: "play", card, difficulty: level };
}

function playTurn(state, player, difficulty = "medium") {
  const action = chooseAction(state, player, difficulty);
  if (action.type === "play") {
    return { action, result: game.playCard(state, player, action.card) };
  }
  if (action.type === "take") {
    return { action, result: game.take(state, player) };
  }
  return { action, result: null };
}

module.exports = {
  normalizeDifficulty,
  legalCards,
  chooseAction,
  playTurn
};

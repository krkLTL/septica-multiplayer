const assert = require("node:assert/strict");
const game = require("../src/game");
const ai = require("../src/ai");

function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function cardsIn(state) {
  return [...state.deck, ...state.hands[0], ...state.hands[1], ...state.sequence, ...state.piles[0], ...state.piles[1]];
}

function checkCards(state, where) {
  game.assertInvariant(state);
  const cards = cardsIn(state);
  assert.equal(cards.length, 32, `${where}: expected 32 physical cards`);
  assert.ok(cards.every(card => card && typeof card === "object"), `${where}: found rank-only card`);
  assert.equal(new Set(cards.map(card => card.id)).size, 32, `${where}: card ID duplicated`);
  assert.ok(cards.every(Object.isFrozen), `${where}: card identity object was mutated`);
}

function playPveRound(state, random, roundNo) {
  let steps = 0;
  while (state.status === "playing" && state.round === roundNo && steps++ < 500) {
    const player = state.turn;
    if (player === 1) {
      const action = ai.chooseAction(state, 1, "medium");
      if (action.type === "take") game.take(state, player);
      else {
        assert.equal(action.type, "play", "AI must produce a playable action");
        game.playCard(state, player, action.card.id);
      }
    } else if (!state.sequence.length) {
      const card = state.hands[player][Math.floor(random() * state.hands[player].length)];
      game.playCard(state, player, card.id);
    } else {
      const legal = state.hands[player].filter(card => game.canPlay(state, player, card));
      const canTake = state.sequence.length >= 2 && state.starter === player;
      if (canTake && (!legal.length || random() < 0.28)) game.take(state, player);
      else {
        assert.ok(legal.length, "human turn has no legal move");
        game.playCard(state, player, legal[Math.floor(random() * legal.length)].id);
      }
    }
    checkCards(state, `round ${roundNo}, step ${steps}`);
  }
  assert.ok(steps < 500, `round ${roundNo} exceeded the action limit`);
  assert.notEqual(state.status, "playing", `round ${roundNo} did not complete`);
}

const previousRandom = Math.random;
Math.random = seededRandom(0x5e71ca);
try {
  const deck = game.makeDeck();
  assert.equal(deck.length, 32);
  assert.equal(new Set(deck.map(card => card.id)).size, 32);
  for (const rank of ["A", "K", "Q", "J", "10", "9", "8", "7"]) {
    assert.equal(deck.filter(card => card.rank === rank).length, 4, `${rank} count`);
    assert.equal(new Set(deck.filter(card => card.rank === rank).map(card => card.suit)).size, 4, `${rank} suits`);
  }

  const state = game.newState();
  game.startRound(state, false, 0);
  checkCards(state, "initial deal");
  assert.equal(state.deck.length, 24);

  for (let completed = 1; completed <= 2; completed++) {
    const thisRound = state.round;
    playPveRound(state, Math.random, thisRound);
    if (completed < 2) {
      game.nextRound(state);
      checkCards(state, "between PvE rounds");
    }
  }
  console.log("PASS: 32 unique rank+suit card objects; two complete local PvE rounds with identity checks after every move.");
} finally {
  Math.random = previousRandom;
}

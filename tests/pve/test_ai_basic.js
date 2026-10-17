const assert = require("assert");
const game = require("../../src/game");
const ai = require("../../src/ai");

function playingState() {
  const state = game.newState();
  game.startRound(state, false, 1);
  return state;
}

for (const level of ["easy", "medium", "hard", "unknown"]) {
  const state = playingState();
  const action = ai.chooseAction(state, state.turn, level);
  assert.ok(["play", "take"].includes(action.type), `${level}: AI should make a move`);
  ai.playTurn(state, state.turn, level);
  assert.ok(state.sequence.length >= 0);
}

{
  const state = playingState();
  state.hands[0] = ["K", "Q", "J", "8"];
  state.hands[1] = ["10", "9", "8", "7"];
  state.deck = [];
  state.turn = 0;
  state.sequence = ["A", "10"];
  state.turn = 0;
  state.starter = 0;
  const action = ai.chooseAction(state, 0, "hard");
  assert.strictEqual(action.type, "take");
}

console.log("PASS: PvE AI action and difficulty contract");

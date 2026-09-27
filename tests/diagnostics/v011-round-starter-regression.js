const assert = require("assert");
const g = require("../../src/game");

function forceNoSepticaRandom() {
  const original = Math.random;
  Math.random = () => 0.5;
  return () => {
    Math.random = original;
  };
}

function prepareFinishedRound(winner) {
  const s = g.newState();

  s.status = "round_finished";
  s.round = 1;
  s.small = winner === 0 ? [1, 0] : [0, 1];
  s.roundResult = {
    points: winner === 0 ? [5, 3] : [3, 5],
    winner,
    draw: false,
    double: false,
    septica: false
  };

  return s;
}

const restoreRandom = forceNoSepticaRandom();
try {
  // Runda câștigată de A -> A începe runda următoare.
  let s = prepareFinishedRound(0);
  g.nextRound(s);

  assert.equal(s.round, 2);
  assert.equal(s.turn, 0);
  assert.equal(s.status, "playing");
  assert.equal(s.hands[0].length, 4);
  assert.equal(s.hands[1].length, 4);
  assert.equal(s.deck.length, 24);
  assert.equal(g.totalCards(s), 32);

  // Runda câștigată de B -> B începe runda următoare.
  s = prepareFinishedRound(1);
  g.nextRound(s);

  assert.equal(s.round, 2);
  assert.equal(s.turn, 1);
  assert.equal(s.status, "playing");
  assert.equal(s.hands[0].length, 4);
  assert.equal(s.hands[1].length, 4);
  assert.equal(s.deck.length, 24);
  assert.equal(g.totalCards(s), 32);

  console.log(
    "PASS: v011 winner of round starts the next round"
  );
} finally {
  restoreRandom();
}

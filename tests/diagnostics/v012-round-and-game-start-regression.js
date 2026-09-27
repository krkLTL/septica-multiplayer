const assert = require("assert");
const g = require("../../src/game");

function forceStableRandom() {
  const original = Math.random;
  Math.random = () => 0.5;
  return () => {
    Math.random = original;
  };
}

function freshRoundState(winner) {
  const s = g.newState();
  s.status = "round_finished";
  s.round = 1;
  s.gameStarter = 0;
  s.roundResult = {
    points: winner === 0 ? [5, 3] : [3, 5],
    winner,
    draw: false,
    double: false,
    septica: false
  };
  return s;
}

function freshDrawState(lastSequenceWinner) {
  const s = g.newState();
  s.status = "round_draw";
  s.round = 1;
  s.gameStarter = 0;
  s.lastSequenceWinner = lastSequenceWinner;
  s.roundResult = {
    points: [4, 4],
    winner: null,
    draw: true,
    double: false,
    septica: false
  };
  return s;
}

function freshFinishedGame(initialStarter, winner, wasDouble) {
  const s = g.newState();
  s.status = "game_finished";
  s.round = 3;
  s.game = 2;
  s.gameStarter = initialStarter;
  s.big = winner === 0 ? [1, 0] : [0, 1];
  s.roundResult = {
    points: wasDouble ? [4, 4] : (winner === 0 ? [5, 3] : [3, 5]),
    winner,
    draw: false,
    double: wasDouble,
    septica: false
  };
  s.gameResult = {
    winner,
    game: 1,
    reason: "round"
  };
  return s;
}

const restoreRandom = forceStableRandom();
try {
  // Normal round: winner of the round starts the next round.
  let s = freshRoundState(1);
  g.nextRound(s);
  assert.equal(s.turn, 1);
  assert.equal(s.gameStarter, 0);
  assert.equal(s.round, 2);
  assert.equal(s.deck.length, 24);
  assert.equal(g.totalCards(s), 32);

  // 4–4: the winner of the last resolved sequence starts the next round.
  s = freshDrawState(0);
  g.nextRound(s);
  assert.equal(s.turn, 0);
  assert.equal(s.gameStarter, 0);
  assert.equal(s.round, 2);

  s = freshDrawState(1);
  g.nextRound(s);
  assert.equal(s.turn, 1);
  assert.equal(s.gameStarter, 0);
  assert.equal(s.round, 2);

  // New normal game: the player who started the previous game does NOT start.
  s = freshFinishedGame(0, 1, false);
  g.nextRound(s);
  assert.equal(s.turn, 1);
  assert.equal(s.gameStarter, 1);
  assert.equal(s.round, 1);
  assert.equal(s.big[0], 0);
  assert.equal(s.big[1], 1);

  s = freshFinishedGame(1, 0, false);
  g.nextRound(s);
  assert.equal(s.turn, 0);
  assert.equal(s.gameStarter, 0);
  assert.equal(s.round, 1);

  // New game after double: the double-game winner starts.
  s = freshFinishedGame(0, 1, true);
  g.nextRound(s);
  assert.equal(s.turn, 1);
  assert.equal(s.gameStarter, 1);
  assert.equal(s.round, 1);

  s = freshFinishedGame(1, 0, true);
  g.nextRound(s);
  assert.equal(s.turn, 0);
  assert.equal(s.gameStarter, 0);
  assert.equal(s.round, 1);

  console.log("PASS: v012 round/game starting-player rules");
} finally {
  restoreRandom();
}

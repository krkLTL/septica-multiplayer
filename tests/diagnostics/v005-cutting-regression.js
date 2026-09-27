const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

function state(handA, handB, seq, starter, turn) {
  const s = g.newState();
  s.status = "playing";
  s.deck = [];
  s.hands = [handA.slice(), handB.slice()];
  s.sequence = seq.slice();
  s.starter = starter;
  s.turn = turn;
  const used = s.hands[0].length + s.hands[1].length + s.sequence.length;
  s.piles = [Array(32 - used).fill("K"), []];
  g.assertInvariant(s);
  return s;
}

// 7 cuts any value; decision returns to the player who was cut.
{
  const s = state(["10", "7"], ["7"], ["10"], 0, 1);
  const r = g.playCard(s, 1, "7");
  assert(r.kind === "continue", "7 must continue");
  assert(s.turn === 0, "decision must return to A");
}

// Initial value also cuts/continues; decision returns to the player who was cut.
{
  const s = state(["10"], ["10"], ["10"], 0, 1);
  const r = g.playCard(s, 1, "10");
  assert(r.kind === "continue", "initial value must continue");
  assert(s.turn === 0, "decision must return to A");
}

// After A responds to the cut, B gets the next decision.
{
  const s = state(["10", "7"], ["7", "10"], ["10", "7"], 0, 0);
  const r = g.playCard(s, 0, "7");
  assert(r.kind === "continue", "A's 7 must continue");
  assert(s.turn === 1, "decision must pass to B");
}

console.log("PASS: v005 cutting/decision regression");

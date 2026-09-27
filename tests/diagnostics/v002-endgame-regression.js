const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw Error("FAIL: " + m);
}

function makeState(handA, handB, sequence) {
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const cards = [];
  for (const r of ranks) for (let i = 0; i < 4; i++) cards.push(r);

  const used = [...handA, ...handB, ...sequence];
  const remaining = cards.slice();
  for (const c of used) {
    const i = remaining.indexOf(c);
    if (i < 0) throw new Error("Fixture overuses card: " + c);
    remaining.splice(i, 1);
  }

  const s = g.newState();
  s.status = "playing";
  s.deck = [];
  s.hands = [handA.slice(), handB.slice()];
  s.sequence = sequence.slice();
  s.piles = [remaining.slice(0, Math.floor(remaining.length / 2)), remaining.slice(Math.floor(remaining.length / 2))];
  s.starter = 0;
  s.turn = 0;
  g.assertInvariant(s);
  return s;
}

// P=0, A=0, B>0: round continues.
{
  const s = makeState([], ["Q"], ["10", "10"]);
  const r = g.take(s, 0);
  assert(r.kind === "take", "TAKE should finish the sequence");
  assert(s.hands[0].length === 0, "A should have 0 cards");
  assert(s.hands[1].length === 1, "B should still have 1 card");
  assert(s.status === "playing", "round must continue while B still has cards");
  assert(s.turn === 1, "sequence winner B should start next sequence");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

// P=0, A=0, B=0: round finishes.
{
  const s = makeState([], [], ["10", "10"]);
  const r = g.take(s, 0);
  assert(r.kind === "take", "TAKE should finish the sequence");
  assert(s.hands[0].length === 0 && s.hands[1].length === 0, "both hands should be empty");
  assert(s.status === "round_draw" || s.status === "round_finished" || s.status === "game_finished",
    "round must finish when both hands are empty");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

console.log("PASS: v002 endgame regression");

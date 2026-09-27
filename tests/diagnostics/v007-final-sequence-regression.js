const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

function finalState(handA, handB) {
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const cards = [];
  for (const r of ranks) for (let i = 0; i < 4; i++) cards.push(r);

  const used = [...handA, ...handB];
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
  s.sequence = [];
  const mid = Math.floor(remaining.length / 2);
  s.piles = [remaining.slice(0, mid), remaining.slice(mid)];
  s.starter = null;
  s.turn = 0;
  g.assertInvariant(s);
  return s;
}

// Final sequence resolves by concession and empties both hands.
{
  const s = finalState(["10"], ["A"]);
  const r1 = g.playCard(s, 0, "10");
  assert(r1.kind === "start", "A must start the final sequence");

  const r2 = g.playCard(s, 1, "A");
  assert(r2.kind === "surrender", "B's A must resolve the sequence");
  assert(r2.winner === 0, "A must win B's concession");
  assert(s.hands[0].length === 0 && s.hands[1].length === 0, "both hands must be empty");
  assert(s.status !== "playing", "round must finish");
  assert(s.piles[0].length + s.piles[1].length === 32, "all 32 cards must be in piles");
}

// Final legal continuation: B plays the final legal card and A has no cards.
{
  const s = finalState(["10"], ["10"]);
  const r1 = g.playCard(s, 0, "10");
  assert(r1.kind === "start", "A must start");

  const r2 = g.playCard(s, 1, "10");
  assert(r2.kind === "continue" || r2.final === true, "matching value must continue");
  assert(r2.winner === 1 || s.status !== "playing", "B must own the final sequence");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

console.log("PASS: v007 final-sequence regression");

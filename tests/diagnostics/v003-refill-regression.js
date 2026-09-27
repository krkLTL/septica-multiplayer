const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

// Build a valid 32-card state. Values are deliberately distributed
// without relying on repeated copies of a single rank.
function makeState(handA, handB, deckCount) {
  const total = handA + handB + deckCount;
  const pileCount = 32 - total;
  if (pileCount < 0) throw new Error("Invalid fixture size");

  const s = g.newState();
  s.status = "playing";

  const ranks = ["8", "9", "J", "Q", "K", "A", "10", "7"];
  const cards = [];
  for (const r of ranks) {
    for (let i = 0; i < 4; i++) cards.push(r);
  }

  s.hands = [
    cards.slice(0, handA),
    cards.slice(handA, handA + handB)
  ];
  s.deck = cards.slice(handA + handB, handA + handB + deckCount);
  s.sequence = [];
  s.piles = [
    cards.slice(handA + handB + deckCount, 32),
    []
  ];
  s.starter = 0;
  s.turn = 0;

  g.assertInvariant(s);
  return s;
}

function testRefill(a, b, p, expected) {
  const s = makeState(a, b, p);

  // Model a completed sequence whose winner is A.
  // The sequence itself is represented separately and already resolved
  // for this refill-focused fixture.
  s.sequence = ["8", "9"];
  s.piles[0].pop();
  s.piles[0].pop();

  // Restore the global 32-card invariant: sequence cards are now in play.
  g.assertInvariant(s);

  // A is the sequence winner and therefore draws first.
  g.take(s, 0);

  assert(
    s.hands[0].length === expected &&
    s.hands[1].length === expected,
    `${a}/${b}+P${p}: expected ${expected}/${expected}, got ${s.hands[0].length}/${s.hands[1].length}`
  );

  assert(s.deck.length === 0, `${a}/${b}+P${p}: packet should be empty`);
}

testRefill(0, 0, 8, 4);
testRefill(0, 0, 6, 3);
testRefill(0, 0, 4, 2);
testRefill(0, 0, 2, 1);

testRefill(1, 1, 6, 4);
testRefill(1, 1, 4, 3);
testRefill(1, 1, 2, 2);

testRefill(2, 2, 4, 4);
testRefill(2, 2, 2, 3);

testRefill(3, 3, 2, 4);

console.log("PASS: v003 refill regression");

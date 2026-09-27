const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

function makeState() {
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const cards = [];
  for (const r of ranks) for (let i = 0; i < 4; i++) cards.push(r);

  const sequence = ["9", "9"];
  const handA = ["8", "7", "Q"];
  const handB = ["10", "7", "J"];
  const deck = ["A", "K"];

  const used = [...sequence, ...handA, ...handB, ...deck];
  const remaining = cards.slice();
  for (const c of used) {
    const i = remaining.indexOf(c);
    if (i < 0) throw new Error("Fixture overuses card: " + c);
    remaining.splice(i, 1);
  }

  const s = g.newState();
  s.status = "playing";
  s.hands = [handA, handB];
  s.deck = deck;
  s.sequence = sequence;
  s.piles = [remaining.slice(0, 11), remaining.slice(11)];
  s.starter = 0;
  s.turn = 0;
  g.assertInvariant(s);
  return s;
}

// Positive TAKE: TĂIATUL A says "Ia-le"; TĂIETORUL B wins.
{
  const s = makeState();
  const pa = s.piles[0].length;
  const pb = s.piles[1].length;
  const r = g.take(s, 0);

  assert(r.winner === 1, "TAKE must give the sequence to B");
  assert(r.sequence.join(" -> ") === "9 -> 9", "sequence must be 9 -> 9");
  assert(s.piles[0].length === pa, "A must not receive the sequence");
  assert(s.piles[1].length === pb + 2, "B must receive both sequence cards");
  assert(s.hands[0].length === 4 && s.hands[1].length === 4, "hands must refill to 4/4");
  assert(s.deck.length === 0, "packet must be empty");
  assert(s.turn === 1, "B must start the next sequence");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

// Negative TAKE: TĂIETORUL must not be allowed to use TAKE.
{
  const s = makeState();
  s.turn = 1;
  let threw = false;
  try { g.take(s, 1); } catch (e) { threw = true; }
  assert(threw, "TAIETORUL must not be allowed to TAKE");
}

console.log("PASS: v004 TAKE ownership regression");

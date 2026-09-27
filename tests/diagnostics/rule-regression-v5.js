const g = require("../../src/game");

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
}

// Build every fixture from the real 32-card deck multiset.
// No card is inserted into sequence after the invariant is checked.
function makeState({ handA, handB, deck = [], sequence = [], turn, starter }) {
  const values = ["A", "K", "Q", "J", "10", "9", "8", "7"];
  const counts = Object.fromEntries(values.map(v => [v, 4]));

  for (const c of [...handA, ...handB, ...deck, ...sequence]) {
    if (!(c in counts) || counts[c] <= 0) {
      throw new Error(`Invalid fixture card: ${c}`);
    }
    counts[c]--;
  }

  const pileA = [];
  for (const v of values) {
    while (counts[v] > 0) {
      pileA.push(v);
      counts[v]--;
    }
  }

  const s = g.newState();
  s.status = "playing";
  s.hands = [handA.slice(), handB.slice()];
  s.deck = deck.slice();
  s.sequence = sequence.slice();
  s.piles = [pileA, []];
  s.turn = turn;
  s.starter = starter;

  g.assertInvariant(s);
  return s;
}

console.log("=== SEPTICA V5 REGRESSION ===");

// 1. First card starts a sequence.
{
  const s = makeState({
    handA: ["10"],
    handB: ["7"],
    sequence: [],
    deck: [],
    turn: 0,
    starter: null
  });

  const r = g.playCard(s, 0, "10");

  assert(r.kind === "start", "first card must start sequence");
  assert(s.sequence.join(" -> ") === "10", "initial card missing");
  assert(s.starter === 0, "starter must be A");
  assert(s.turn === 1, "decision must pass to B");
}

// 2. 7 continues/cuts the sequence.
// Decision returns to the player who was cut.
{
  const s = makeState({
    handA: ["K"],
    handB: ["7"],
    sequence: ["10"],
    deck: [],
    turn: 1,
    starter: 0
  });

  const r = g.playCard(s, 1, "7");

  assert(r.kind === "continue", "7 must continue/cut");
  assert(s.sequence.join(" -> ") === "10 -> 7", "sequence mismatch");
  assert(s.turn === 0, "decision must return to A");
}

// 3. Initial value also continues/cuts the sequence.
{
  const s = makeState({
    handA: ["K"],
    handB: ["10"],
    sequence: ["10"],
    deck: [],
    turn: 1,
    starter: 0
  });

  const r = g.playCard(s, 1, "10");

  assert(r.kind === "continue", "initial value must continue/cut");
  assert(s.sequence.join(" -> ") === "10 -> 10", "sequence mismatch");
  assert(s.turn === 0, "decision must return to A");
}

// 4. A different value is concession-by-card.
// The player who started the sequence wins.
{
  const s = makeState({
    handA: ["K"],
    handB: ["8"],
    sequence: ["10"],
    deck: [],
    turn: 1,
    starter: 0
  });

  const r = g.playCard(s, 1, "8");

  assert(r.kind === "surrender", "different value must surrender by card");
  assert(r.winner === 0, "starter A must win concession-by-card");
  assert(r.sequence.join(" -> ") === "10 -> 8", "surrender card missing");
}

// 5. Final legal card rule.
// A starts with 10. B plays the final legal 7.
// A has no cards left and the deck is empty, so B wins.
{
  const s = makeState({
    handA: ["10"],
    handB: ["7"],
    sequence: [],
    deck: [],
    turn: 0,
    starter: null
  });

  g.playCard(s, 0, "10");
  const r = g.playCard(s, 1, "7");

  assert(r.final === true, "final sequence flag missing");
  assert(r.winner === 1, "B must win after the final legal card");
  assert(s.status !== "playing", "round must finish");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

// 6. Only A and 10 score.
{
  assert(
    g.points(["A", "10", "K", "Q", "J", "9", "8", "7"]) === 2,
    "A and 10 must be the only point cards"
  );
  assert(
    g.points(["K", "Q", "J", "9", "8", "7"]) === 0,
    "non-point cards must score zero"
  );
}

// 7-10. Exact refill distributions.
// 0/0 + 8, 1/1 + 6, 2/2 + 4, 3/3 + 2.
// TAKE is called by the player who has the decision; the opponent wins
// the sequence and therefore draws first.
function refillCase(startA, startB, deckCount) {
  const s = makeState({
    handA: Array(startA).fill("8"),
    handB: Array(startB).fill("9"),
    deck: Array(deckCount).fill("7"),
    sequence: ["K", "Q"],
    turn: 0,
    starter: 0
  });

  g.take(s, 0);

  assert(
    s.hands[0].length === 4,
    `A should have 4 cards, got ${s.hands[0].length}`
  );
  assert(
    s.hands[1].length === 4,
    `B should have 4 cards, got ${s.hands[1].length}`
  );
  assert(
    s.deck.length === 0,
    `deck should be empty, got ${s.deck.length}`
  );
  assert(g.totalCards(s) === 32, "refill broke the 32-card invariant");
}

refillCase(0, 0, 8);
refillCase(1, 1, 6);
refillCase(2, 2, 4);
refillCase(3, 3, 2);

console.log("PASS: all v5 confirmed regression tests");

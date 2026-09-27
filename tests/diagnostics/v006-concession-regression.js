const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

function state(handA, handB, seq, starter, turn, deck = ["A", "10"]) {
  const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const cards = [];
  for (const r of ranks) for (let i = 0; i < 4; i++) cards.push(r);

  const used = [...handA, ...handB, ...seq, ...deck];
  const remaining = cards.slice();
  for (const c of used) {
    const i = remaining.indexOf(c);
    if (i < 0) throw new Error("Fixture overuses card: " + c);
    remaining.splice(i, 1);
  }

  const s = g.newState();
  s.status = "playing";
  s.deck = deck.slice();
  s.hands = [handA.slice(), handB.slice()];
  s.sequence = seq.slice();
  const mid = Math.floor(remaining.length / 2);
  s.piles = [remaining.slice(0, mid), remaining.slice(mid)];
  s.starter = starter;
  s.turn = turn;
  g.assertInvariant(s);
  return s;
}

// Confirmed sequence: A:K -> B:7 -> A:7 -> B:Q.
// B's Q is a concession-by-card. A wins the sequence.
{
  const s = state(
    ["7", "8"],
    ["7", "Q"],
    ["K"],
    0,
    1
  );

  const r1 = g.playCard(s, 1, "7");
  assert(r1.kind === "continue", "B's 7 must continue");
  assert(s.starter === 0 && s.turn === 0, "roles remain fixed within the sequence");

  const r2 = g.playCard(s, 0, "7");
  assert(r2.kind === "continue", "A's 7 must continue");
  assert(s.starter === 0 && s.turn === 1, "decision must return to the TĂIETORUL");

  const r3 = g.playCard(s, 1, "Q");
  assert(r3.kind === "surrender", "B's Q must be concession-by-card");
  assert(r3.winner === 0, "A must win B's concession");
  assert(s.sequence.length === 0, "resolved sequence must leave the table");
  assert(s.turn === 0, "A must start the next sequence");
  assert(g.totalCards(s) === 32, "32-card invariant broken");
}

// TĂIATUL does not concede by throwing a non-cutting card.
// If A has no reper/7 after B's cut, A must use TAKE.
{
  const s = state(
    ["Q"],
    ["7"],
    ["K"],
    0,
    1,
    ["A", "10"]
  );

  g.playCard(s, 1, "7");
  assert(s.starter === 0 && s.turn === 0, "A must be the current TĂIATUL");

  let threw = false;
  try {
    g.playCard(s, 0, "Q");
  } catch (e) {
    threw = true;
  }
  assert(threw, "TĂIATUL must not concede by throwing a card");
  assert(s.sequence.join(" -> ") === "K -> 7", "invalid card must not change the sequence");

  const r = g.take(s, 0);
  assert(r.kind === "take", "TĂIATUL must be able to say Ia-le");
  assert(r.winner === 1, "Ia-le must give the sequence to TĂIETORUL");
}

console.log("PASS: v006 concession / TĂIATUL rule regression");

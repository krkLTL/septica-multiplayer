const g = require("../../src/game");

const VALUES = ["A", "K", "Q", "J", "10", "9", "8", "7"];

function fullDeck() {
  const d = [];
  for (const v of VALUES) {
    for (let i = 0; i < 4; i++) d.push(v);
  }
  return d;
}

function removeOne(deck, card) {
  const i = deck.indexOf(card);
  if (i === -1) throw new Error(`Fixture error: missing card ${card}`);
  deck.splice(i, 1);
}

function makeState({ hands, piles = [[], []], sequence = [], turn, starter = null }) {
  const deck = fullDeck();

  for (const hand of hands) {
    for (const card of hand) removeOne(deck, card);
  }
  for (const pile of piles) {
    for (const card of pile) removeOne(deck, card);
  }
  for (const card of sequence) removeOne(deck, card);

  const s = g.newState();
  s.deck = deck;
  s.hands = hands.map(h => [...h]);
  s.piles = piles.map(p => [...p]);
  s.sequence = [...sequence];
  s.turn = turn;
  s.starter = starter;
  s.status = "playing";

  g.assertInvariant(s);
  return s;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function assertThrows(fn, expected, msg) {
  try {
    fn();
  } catch (e) {
    assert(e.message === expected, `${msg} (expected ${expected}, got ${e.message})`);
    return;
  }
  throw new Error(`FAIL: ${msg} (no error thrown)`);
}

let failures = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    failures++;
    console.error(`FAIL: ${name}`);
    console.error(`  ${e.message}`);
  }
}

// 1. Direct concession-by-card.
run("v010-01 direct concession-by-card", () => {
  const s = makeState({
    hands: [
      ["K", "8", "9", "J"],
      ["Q", "A", "10", "7"]
    ],
    turn: 0
  });

  const r1 = g.playCard(s, 0, "K");
  assert(r1.kind === "start", "A must start the sequence");
  assert(s.starter === 0 && s.turn === 1, "A must be TAIATUL and B must respond");

  const r2 = g.playCard(s, 1, "Q");
  assert(r2.kind === "surrender", "B must concede by card");
  assert(r2.winner === 0, "A must win the sequence");
  assert(s.piles[0].slice(-2).join("|") === "K|Q", "A must take K,Q");
  assert(s.turn === 0, "A must start the next sequence");
  assert(s.hands[0].length === 4 && s.hands[1].length === 4, "Both hands must refill to 4");
});

// 2. After B continues with 7, A can say TAKE.
run("v010-02 no continuation for TAIATUL -> TAKE", () => {
  const s = makeState({
    hands: [
      ["K", "Q", "8", "9"],
      ["7", "A", "10", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");

  assert(s.turn === 0, "After B:7, A must have the decision");
  assert(s.starter === 0, "A remains TAIATUL for the sequence");

  const r = g.take(s, 0);
  assert(r.kind === "take", "A must be able to say TAKE");
  assert(r.winner === 1, "B must win after A says TAKE");
  assert(s.turn === 1, "B must start the next sequence");
});

// 3. Corrected fixture: B owns Q and starts the next sequence with Q.
run("v010-03 valid post-7 TAKE then next sequence", () => {
  const s = makeState({
    hands: [
      ["K", "8", "9", "J"],
      ["7", "Q", "A", "10"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");
  g.take(s, 0);

  assert(s.turn === 1, "B must own the next-sequence initiative");

  const r = g.playCard(s, 1, "Q");
  assert(r.kind === "start", "B:Q must start a new sequence");
  assert(s.starter === 1, "B must now be TAIATUL");
});

// 4. TAIETORUL cannot play twice in a row.
run("v010-04 TAIETORUL cannot play twice in a row", () => {
  const s = makeState({
    hands: [
      ["K", "Q", "8", "9"],
      ["7", "A", "10", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");

  assertThrows(
    () => g.playCard(s, 1, "Q"),
    "INVALID_MOVE",
    "B must not be able to play again before A responds"
  );
});

// 5. TAIATUL cannot concede by throwing a random card.
run("v010-05 TAIATUL cannot concede by card", () => {
  const s = makeState({
    hands: [
      ["K", "Q", "8", "9"],
      ["7", "A", "10", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");

  assertThrows(
    () => g.playCard(s, 0, "Q"),
    "INVALID_MOVE",
    "A must not concede the sequence by playing Q"
  );
});

// 6. Strong TAKE ownership test:
// after A continues, B is TAIETORUL AND has the decision.
// B must still be forbidden from TAKE.
run("v010-06 TAIETORUL cannot TAKE even when it has the decision", () => {
  const s = makeState({
    hands: [
      ["K", "K", "8", "9"],
      ["7", "A", "10", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K"); // A = TAIATUL, B responds
  g.playCard(s, 1, "7"); // A must decide
  g.playCard(s, 0, "K"); // A continues; now B has the decision

  assert(s.turn === 1, "B must have the decision");
  assert(s.starter === 0, "A must remain TAIATUL");
  assertThrows(
    () => g.take(s, 1),
    "INVALID_TAKE_ROLE",
    "B must not be allowed to TAKE even when B has the decision"
  );
});

// 7. Roles do not switch inside a sequence.
run("v010-07 roles do not switch inside a sequence", () => {
  const s = makeState({
    hands: [
      ["K", "Q", "8", "9"],
      ["7", "A", "10", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");

  assert(s.starter === 0, "A must remain TAIATUL inside the same sequence");
  assert(s.turn === 0, "A must receive the next decision");

  assertThrows(
    () => g.playCard(s, 1, "A"),
    "INVALID_MOVE",
    "B must not act again inside the same sequence"
  );
});

// 8. Two pieces, then B concedes by card.
run("v010-08 two-piece concession", () => {
  const s = makeState({
    hands: [
      ["10", "10", "9", "8"],
      ["7", "Q", "J", "K"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "10");
  g.playCard(s, 1, "7");
  g.playCard(s, 0, "10");

  assert(s.starter === 0, "A remains TAIATUL across both pieces");
  assert(s.turn === 1, "B must respond to A's second card");

  const r = g.playCard(s, 1, "Q");
  assert(r.kind === "surrender", "B must concede by card");
  assert(r.winner === 0, "A must win the whole sequence");
  assert(r.sequence.join("|") === "10|7|10|Q", "The whole sequence must be awarded");
  assert(s.turn === 0, "A must start the next sequence");
});

// 9. Three pieces, then A says TAKE.
run("v010-09 three-piece TAKE", () => {
  const s = makeState({
    hands: [
      ["10", "10", "10", "K"],
      ["7", "7", "7", "Q"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "10");
  g.playCard(s, 1, "7");
  g.playCard(s, 0, "10");
  g.playCard(s, 1, "7");
  g.playCard(s, 0, "10");
  g.playCard(s, 1, "7");

  assert(s.turn === 0, "A must have the decision after the third piece");
  assert(s.starter === 0, "A remains TAIATUL");

  const r = g.take(s, 0);
  assert(r.winner === 1, "B must win after A says TAKE");
  assert(r.sequence.join("|") === "10|7|10|7|10|7", "All six cards must be awarded");
  assert(s.turn === 1, "B must start the next sequence");
});

// 10. Winner/refill/next starter after concession.
run("v010-10 winner/refill/next-starter after concession", () => {
  const s = makeState({
    hands: [
      ["K", "K", "A", "9"],
      ["7", "10", "Q", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "K");
  g.playCard(s, 1, "7");
  g.playCard(s, 0, "K");
  const r = g.playCard(s, 1, "Q");

  assert(r.winner === 0, "A must win");
  assert(s.sequence.length === 0, "Sequence must be resolved");
  assert(s.starter === null, "Resolved sequence has no active starter");
  assert(s.turn === 0, "Winner A must start next sequence");
  assert(s.hands[0].length === 4 && s.hands[1].length === 4, "Refill must restore both hands to 4");

  const start = g.playCard(s, 0, "A");
  assert(start.kind === "start", "A must start the next sequence");
  assert(s.starter === 0, "A must become TAIATUL of the next sequence");
});

// 11. Direct concession has only one piece.
run("v010-11 direct concession has no second piece", () => {
  const s = makeState({
    hands: [
      ["Q", "A", "10", "8"],
      ["J", "7", "9", "K"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "Q");
  const r = g.playCard(s, 1, "J");

  assert(r.kind === "surrender", "B must concede by card");
  assert(r.sequence.join("|") === "Q|J", "Only one piece should exist");
  assert(s.sequence.length === 0, "No second piece may be created");
  assert(s.turn === 0, "A must start the next sequence");
});

// 12. Winner starts next sequence as TAIATUL.
run("v010-12 winner starts next sequence as TAIATUL", () => {
  const s = makeState({
    hands: [
      ["10", "10", "K", "A"],
      ["7", "Q", "9", "J"]
    ],
    turn: 0
  });

  g.playCard(s, 0, "10");
  g.playCard(s, 1, "7");
  g.playCard(s, 0, "10");
  const r = g.playCard(s, 1, "Q");

  assert(r.winner === 0, "A must win sequence 1");
  assert(s.turn === 0, "A must start sequence 2");

  g.playCard(s, 0, "K");
  assert(s.starter === 0, "A must be TAIATUL in sequence 2");
});

if (failures) {
  console.error(`=== v010: ${failures} TEST(S) FAILED ===`);
  process.exit(1);
}

console.log("=== ALL v010 SEQUENCE ACCEPTANCE TESTS PASSED ===");

const assert = require("assert");
const g = require("../../src/game");

/*
 * Multiplayer v3 — sequence contract
 *
 * A = TĂIATUL
 * B = TĂIETORUL
 * reper = prima carte jucată din secvență
 * 7 = carte specială care poate continua orice secvență
 * cartof = orice carte obișnuită care nu este reperul și nu este 7
 *
 * Testele folosesc mai multe valori ca reper. Logica nu trebuie să fie
 * dependentă de K.
 */

const FULL_DECK = [
  "A","A","A","A",
  "K","K","K","K",
  "Q","Q","Q","Q",
  "J","J","J","J",
  "10","10","10","10",
  "9","9","9","9",
  "8","8","8","8",
  "7","7","7","7"
];

function stateWithHands(handA, handB) {
  const remaining = [...FULL_DECK];

  for (const card of [...handA, ...handB]) {
    const i = remaining.indexOf(card);
    assert.notEqual(i, -1, `invalid test card: ${card}`);
    remaining.splice(i, 1);
  }

  const s = g.newState();
  s.status = "playing";
  s.turn = 0;
  s.deck = remaining;
  s.hands = [[...handA], [...handB]];
  s.sequence = [];
  s.starter = null;
  s.piles = [[], []];
  s.roundResult = null;

  assert.equal(g.totalCards(s), 32);
  return s;
}

function startWith(reper, response) {
  const s = stateWithHands(
    [reper, "8", "9", "A"],
    [response, "J", "Q", "10"]
  );

  g.playCard(s, 0, reper);
  return s;
}

function assertSurrender(reper, cartof) {
  const s = startWith(reper, cartof);
  const result = g.playCard(s, 1, cartof);

  assert.equal(result.kind, "surrender");
  assert.equal(result.winner, 0);
  assert.equal(s.sequence.length, 0);
  assert.equal(s.piles[0].length, 2);
  assert.equal(s.piles[1].length, 0);
  assert.equal(g.totalCards(s), 32);
}

function assertContinue(reper, response) {
  const s = startWith(reper, response);
  const result = g.playCard(s, 1, response);

  assert.equal(result.kind, "continue");
  assert.equal(s.sequence.length, 2);
  assert.equal(s.sequence[0], reper);
  assert.equal(s.sequence[1], response);
  assert.equal(g.totalCards(s), 32);
}

/* 1–5: reper + reper continues. */
for (const reper of ["K", "Q", "J", "10", "8"]) {
  assertContinue(reper, reper);
}

/* 6–10: reper + cartof causes B to surrender by card. */
for (const [reper, cartof] of [
  ["K", "J"],
  ["Q", "A"],
  ["J", "10"],
  ["10", "9"],
  ["8", "A"]
]) {
  assertSurrender(reper, cartof);
}

/* 11–15: reper + 7 continues. */
for (const reper of ["K", "Q", "J", "10", "8"]) {
  assertContinue(reper, "7");
}

/*
 * B (tăietorul) cannot say "ia-le".
 * A cartof remains a legal surrender move.
 */
{
  const s = startWith("Q", "J");

  assert.throws(
    () => g.take(s, 1),
    /INVALID_TAKE/
  );

  const result = g.playCard(s, 1, "J");
  assert.equal(result.kind, "surrender");
  assert.equal(result.winner, 0);
}

console.log("TEST PASSED: SEQUENCE RULES — REPER/CARTOF/7 (15 CASES)");

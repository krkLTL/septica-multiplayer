const assert = require("assert");
const g = require("../src/game");

// 1. Start round
let s = g.newState();
g.startRound(s);

assert.equal(s.deck.length, 24);
assert.equal(s.hands[0].length, 4);
assert.equal(s.hands[1].length, 4);
assert.equal(g.totalCards(s), 32);

// 2. Complete valid exchange + TAKE
s = g.newState();
g.startRound(s);

// Căutăm o situație în care B poate continua legal.
// Repetăm distribuirea dacă prima mână nu permite un răspuns valid.
let valid = false;

for (let attempt = 0; attempt < 100 && !valid; attempt++) {
  const possible = s.hands[0].find(card =>
    s.hands[1].includes(card) ||
    s.hands[1].includes("7")
  );

  if (possible) {
    const first = possible;

    s.turn = 0;

    g.playCard(s, 0, first);

    const response =
      s.hands[1].find(c => c === first) ||
      s.hands[1].find(c => c === "7");

    assert(response);

    g.playCard(s, 1, response);

    valid = true;
  } else {
    s = g.newState();
    g.startRound(s);
  }
}

assert.equal(valid, true);
assert.equal(s.sequence.length, 2);

// A spune "Ia-le".
// B câștigă secvența.
g.take(s, 0);

assert.equal(s.sequence.length, 0);
assert.equal(
  s.piles[0].length + s.piles[1].length,
  2
);
assert.equal(g.totalCards(s), 32);

// 3. Potato response ends the sequence
s = g.newState();
g.startRound(s);

const opening = s.hands[0][0];
s.turn = 0;

g.playCard(s, 0, opening);

const potato = s.hands[1].find(
  c =>
    c !== opening &&
    c !== "7"
);

if (potato) {
  g.playCard(s, 1, potato);

  assert.equal(s.sequence.length, 0);
  assert.equal(g.totalCards(s), 32);
}

// 4. Complete state must contain exactly 32 cards
assert.equal(g.totalCards(s), 32);

console.log("ALL ENGINE TESTS PASSED");
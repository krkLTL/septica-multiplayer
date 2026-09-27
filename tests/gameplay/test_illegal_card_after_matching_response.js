const assert = require("assert");
const g = require("../../src/game");

const s = g.newState();
g.startRound(s);

// Structură validă: 4 cărți A + 4 cărți B + 24 în deck = 32.
// Păstrăm în mâini cărțile necesare pentru cazul K -> K -> J.
s.hands[0] = ["K", "J", "Q", "8"];
s.hands[1] = ["K", "A", "10", "9"];

// Construim pachetul real de 32 de cărți și scoatem
// cele 8 cărți aflate în mâinile celor doi jucători.
s.deck = g.makeDeck();

for (const card of [...s.hands[0], ...s.hands[1]]) {
  const index = s.deck.indexOf(card);

  if (index === -1) {
    throw new Error(`Fixture error: card ${card} not found in deck`);
  }

  s.deck.splice(index, 1);
}

s.sequence = [];
s.piles = [[], []];

s.starter = null;
s.turn = 0;
s.status = "playing";

// A începe cu K.
g.playCard(s, 0, "K");

assert.deepStrictEqual(s.sequence, ["K"]);
assert.deepStrictEqual(s.hands[0], ["J", "Q", "8"]);
assert.equal(s.turn, 1);

// B răspunde cu K.
// Secvența devine K -> K.
g.playCard(s, 1, "K");

assert.deepStrictEqual(s.sequence, ["K", "K"]);
assert.deepStrictEqual(s.hands[1], ["A", "10", "9"]);
assert.equal(s.turn, 0);

// A NU are voie să joace J.
// După K -> K, trebuie să răspundă cu K sau 7.
// J trebuie respins ca INVALID_MOVE.
assert.throws(
  () => g.playCard(s, 0, "J"),
  /INVALID_MOVE/
);

// Mutarea ilegală nu trebuie să modifice starea.
assert.deepStrictEqual(s.sequence, ["K", "K"]);
assert.deepStrictEqual(s.hands[0], ["J", "Q", "8"]);
assert.deepStrictEqual(s.piles, [[], []]);
assert.equal(s.status, "playing");
assert.equal(s.turn, 0);
assert.equal(g.totalCards(s), 32);

console.log(
  "TEST PASSED: ILLEGAL CARD AFTER MATCHING RESPONSE IS REJECTED"
);
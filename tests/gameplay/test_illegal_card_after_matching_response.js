const assert = require("assert");
const g = require("../../src/game");

const s = g.newState();
g.startRound(s);

// Pastram invariantul de 32 de car?i.
// 2 în mâna lui A + 2 în mâna lui B +
// 2 în secven?a + 26 în deck = 32.
s.hands[0] = ["K", "J"];
s.hands[1] = ["K", "A"];
s.sequence = [];
s.piles = [[], []];
s.deck = Array(26).fill("Q");

s.starter = null;
s.turn = 0;
s.status = "playing";

// A începe cu K.
g.playCard(s, 0, "K");

assert.deepStrictEqual(s.sequence, ["K"]);
assert.deepStrictEqual(s.hands[0], ["J"]);
assert.equal(s.turn, 1);

// B raspunde cu K.
// Secven?a devine K -> K.
g.playCard(s, 1, "K");

assert.deepStrictEqual(s.sequence, ["K", "K"]);
assert.deepStrictEqual(s.hands[1], ["A"]);
assert.equal(s.turn, 0);

// A NU are voie sa joace J.
// Dupa K -> K, trebuie sa raspunda cu K sau 7.
// J trebuie respins ca INVALID_MOVE.
assert.throws(
  () => g.playCard(s, 0, "J"),
  /INVALID_MOVE/
);

// Mutarea ilegala nu trebuie sa modifice starea.
assert.deepStrictEqual(s.sequence, ["K", "K"]);
assert.deepStrictEqual(s.hands[0], ["J"]);
assert.deepStrictEqual(s.piles, [[], []]);
assert.equal(s.status, "playing");
assert.equal(s.turn, 0);

console.log(
  "TEST PASSED: ILLEGAL CARD AFTER MATCHING RESPONSE IS REJECTED"
);

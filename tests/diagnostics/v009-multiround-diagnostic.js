const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

function verifyState(s, label) {
  assert(g.totalCards(s) === 32, `${label}: CARD_INVARIANT`);
  if (s.deck.length === 0) {
    assert(
      s.hands[0].length + s.hands[1].length +
      s.piles[0].length + s.piles[1].length +
      s.sequence.length === 32,
      `${label}: empty-deck conservation`
    );
  }
}

// Deterministic multi-round diagnostic. The policy follows the documented
// role model: TAIETORUL always plays a card; TAIATUL plays the initial value
// or 7 when available, otherwise TAKE is used.
let seed = 0x5E71CA;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

const s = g.newState();
g.startRound(s, false);

let actions = 0;
let rounds = 0;

while (rounds < 100 && actions < 50000) {
  if (s.status !== "playing") {
    rounds++;
    g.nextRound(s);
    verifyState(s, `round-${rounds}-start`);
    continue;
  }

  const p = s.turn;
  assert(p === 0 || p === 1, `invalid turn at action ${actions}`);
  assert(s.hands[p].length > 0, `player ${p} has decision with no cards`);

  if (s.sequence.length === 0) {
    const hand = s.hands[p];
    const c = hand[Math.floor(rnd() * hand.length)];
    g.playCard(s, p, c);
  } else if (p === s.starter) {
    const initial = s.sequence[0];
    const card = s.hands[p].find(c => c === initial) ||
                 s.hands[p].find(c => c === "7");

    if (card) {
      g.playCard(s, p, card);
    } else {
      g.take(s, p);
    }
  } else {
    const hand = s.hands[p];
    const c = hand[Math.floor(rnd() * hand.length)];
    g.playCard(s, p, c);
  }

  actions++;
  verifyState(s, `action-${actions}`);
}

assert(actions > 0, "diagnostic executed no actions");
assert(rounds > 0 || s.status !== "playing", "diagnostic did not reach a resolved round");

console.log(`PASS: v009 multi-round diagnostic (${actions} actions, ${rounds} completed rounds)`);

const g = require("../src/game");

const isPoint = c => c === "A" || c === "10";

function pointCards(cards) {
  return cards.filter(isPoint);
}

function snapshotPoints(s) {
  return {
    deck: pointCards(s.deck),
    handA: pointCards(s.hands[0]),
    handB: pointCards(s.hands[1]),
    sequence: pointCards(s.sequence),
    pileA: pointCards(s.piles[0]),
    pileB: pointCards(s.piles[1])
  };
}

for (let test = 1; test <= 1000; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;

  while (s.status === "playing" && moves < 300) {
    moves++;

    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("\n=== EMPTY HAND ===");
      console.log("test:", test);
      console.dir(snapshotPoints(s), { depth: null });
      process.exit(1);
    }

    let card;

    if (s.sequence.length === 0) {
      card = hand[0];
    } else {
      const target = s.sequence[0];

      card =
        hand.find(c => c === target) ||
        hand.find(c => c === "7") ||
        hand[0];
    }

    try {
      g.playCard(s, p, card);
    } catch (e) {
      console.log("\n=== MOVE ERROR ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("player:", p);
      console.log("card:", card);
      console.log("error:", e.message);
      console.dir(snapshotPoints(s), { depth: null });
      process.exit(1);
    }

    if (
      s.status === "playing" &&
      s.sequence.length >= 2
    ) {
      const current = s.turn;
      const h = s.hands[current];

      const legal =
        h.find(c => c === s.sequence[0]) ||
        h.find(c => c === "7");

      if (!legal && Math.random() < 0.5) {
        g.take(s, current);
      }
    }
  }

  if (moves >= 300) {
    console.log("\n=== STUCK ===");
    console.log("test:", test);
    console.dir(snapshotPoints(s), { depth: null });
    process.exit(1);
  }

  if (
    s.status === "round_finished" ||
    s.status === "round_draw" ||
    s.status === "game_finished"
  ) {
    const x = snapshotPoints(s);

    const all =
      x.deck.length +
      x.handA.length +
      x.handB.length +
      x.sequence.length +
      x.pileA.length +
      x.pileB.length;

    const piles = x.pileA.length + x.pileB.length;

    if (all !== 8 || piles !== 8) {
      console.log("\n=== POINT DISTRIBUTION BUG ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.log("status:", s.status);

      console.log("\nPOINT CARDS BY LOCATION:");
      console.dir(x, { depth: null });

      console.log("\nTOTAL POINT CARDS:", all);
      console.log("POINT CARDS IN PILES:", piles);

      console.log("\nFULL STATE:");
      console.dir({
        deck: s.deck,
        hands: s.hands,
        sequence: s.sequence,
        piles: s.piles,
        roundResult: s.roundResult
      }, { depth: null });

      process.exit(1);
    }
  }

  if (test % 100 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nPOINT DISTRIBUTION DIAGNOSTIC PASSED");

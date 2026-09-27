const g = require("../src/game");

for (let test = 1; test <= 10000; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;

  while (s.status === "playing" && moves < 300) {
    moves++;

    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("\n=== BUG FOUND ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("turn:", s.turn);
      console.log("status:", s.status);
      console.log("deck:", s.deck.length);
      console.log("hand A:", s.hands[0]);
      console.log("hand B:", s.hands[1]);
      console.log("sequence:", s.sequence);
      console.log("starter:", s.starter);
      console.log("piles:", s.piles[0].length, s.piles[1].length);
      console.log("TOTAL:", g.totalCards(s));
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
      console.log("\n=== INVALID MOVE ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("player:", p);
      console.log("card:", card);
      console.log("error:", e.message);
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

    if (g.totalCards(s) !== 32) {
      console.log("\n=== CARD COUNT BUG ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("TOTAL:", g.totalCards(s));
      process.exit(1);
    }
  }

  if (moves >= 300) {
    console.log("\n=== STUCK GAME ===");
    console.log("test:", test);
    console.log("turn:", s.turn);
    console.log("status:", s.status);
    console.log("deck:", s.deck.length);
    console.log("hand A:", s.hands[0]);
    console.log("hand B:", s.hands[1]);
    console.log("sequence:", s.sequence);
    console.log("piles:", s.piles[0].length, s.piles[1].length);
    process.exit(1);
  }

  if (test % 1000 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nDIAGNOSTIC PASSED");

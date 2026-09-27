const g = require("../../src/game");

function snapshot(s) {
  return {
    status: s.status,
    turn: s.turn,
    deck: s.deck.length,
    handA: [...s.hands[0]],
    handB: [...s.hands[1]],
    sequence: [...s.sequence],
    pileA: s.piles[0].length,
    pileB: s.piles[1].length,
    roundResult: s.roundResult
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
      console.log("\n=== EMPTY HAND DURING PLAY ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.dir(snapshot(s), { depth: null });
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
      console.log("moves:", moves);
      console.log("player:", p);
      console.log("card:", card);
      console.log("error:", e.message);
      console.dir(snapshot(s), { depth: null });
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
        try {
          g.take(s, current);
        } catch (e) {
          console.log("\n=== TAKE FAILED ===");
          console.log("test:", test);
          console.log("moves:", moves);
          console.log("error:", e.message);
          console.dir(snapshot(s), { depth: null });
          process.exit(1);
        }
      }
    }

    if (g.totalCards(s) !== 32) {
      console.log("\n=== CARD COUNT BUG ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.log("total:", g.totalCards(s));
      console.dir(snapshot(s), { depth: null });
      process.exit(1);
    }
  }

  if (moves >= 300) {
    console.log("\n=== STUCK ROUND ===");
    console.log("test:", test);
    console.dir(snapshot(s), { depth: null });
    process.exit(1);
  }

  if (
    s.status === "round_finished" ||
    s.status === "round_draw" ||
    s.status === "game_finished"
  ) {
    const remaining =
      s.deck.length +
      s.hands[0].length +
      s.hands[1].length +
      s.sequence.length;

    if (
      s.deck.length !== 0 ||
      s.hands[0].length !== 0 ||
      s.hands[1].length !== 0 ||
      s.sequence.length !== 0
    ) {
      console.log("\n=== PREMATURE ROUND END ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.log("remaining outside piles:", remaining);
      console.dir(snapshot(s), { depth: null });
      process.exit(1);
    }
  }

  if (test % 100 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nTEST PASSED: ROUND COMPLETION - NO CARDS REMAIN");

const g = require("../src/game");

function realPoints(cards) {
  return cards.reduce(
    (n, c) => n + (c === "A" || c === "10" ? 1 : 0),
    0
  );
}

function snapshot(s) {
  return {
    round: s.round,
    status: s.status,
    deck: [...s.deck],
    handA: [...s.hands[0]],
    handB: [...s.hands[1]],
    sequence: [...s.sequence],
    pileA: [...s.piles[0]],
    pileB: [...s.piles[1]],
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
      console.log("\n=== BUG: EMPTY HAND ===");
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

    g.playCard(s, p, card);

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
      console.dir(snapshot(s), { depth: null });
      process.exit(1);
    }
  }

  if (moves >= 300) {
    console.log("\n=== STUCK ===");
    console.dir(snapshot(s), { depth: null });
    process.exit(1);
  }

  if (
    s.status === "round_finished" ||
    s.status === "round_draw" ||
    s.status === "game_finished"
  ) {
    const actualA = realPoints(s.piles[0]);
    const actualB = realPoints(s.piles[1]);

    const reported = s.roundResult
      ? s.roundResult.points
      : null;

    if (
      !reported ||
      reported[0] !== actualA ||
      reported[1] !== actualB
    ) {
      console.log("\n=== SCORE BUG ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.log("status:", s.status);

      console.log("\nACTUAL POINTS:");
      console.log("A:", actualA);
      console.log("B:", actualB);

      console.log("\nREPORTED POINTS:");
      console.dir(reported, { depth: null });

      console.log("\nPILE A:");
      console.dir(s.piles[0], { depth: null });

      console.log("\nPILE B:");
      console.dir(s.piles[1], { depth: null });

      console.log("\nSEQUENCE:");
      console.dir(s.sequence, { depth: null });

      console.log("\nDECK:");
      console.dir(s.deck, { depth: null });

      console.log("\nHANDS:");
      console.dir(s.hands, { depth: null });

      process.exit(1);
    }
  }

  if (test % 100 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nSCORE DIAGNOSTIC PASSED");

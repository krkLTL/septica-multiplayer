const g = require("../src/game");

function snapshot(s) {
  return {
    status: s.status,
    turn: s.turn,
    deck: [...s.deck],
    hands: [ [...s.hands[0]], [...s.hands[1]] ],
    sequence: [...s.sequence],
    piles: [ [...s.piles[0]], [...s.piles[1]] ],
    roundResult: s.roundResult
  };
}

for (let test = 1; test <= 10000; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;

  while (s.status === "playing" && moves < 300) {
    moves++;

    const before = snapshot(s);
    const p = s.turn;
    const card = s.sequence.length === 0
      ? s.hands[p][0]
      : (
          s.hands[p].find(c => c === s.sequence[0]) ||
          s.hands[p].find(c => c === "7") ||
          s.hands[p][0]
        );

    const result = g.playCard(s, p, card);

    if (
      s.status === "round_finished" ||
      s.status === "round_draw" ||
      s.status === "game_finished"
    ) {
      const allCards =
        s.deck.length +
        s.hands[0].length +
        s.hands[1].length +
        s.sequence.length +
        s.piles[0].length +
        s.piles[1].length;

      const handCards = s.hands[0].length + s.hands[1].length;
      const pileCards = s.piles[0].length + s.piles[1].length;

      if (handCards > 0 || s.sequence.length > 0) {
        console.log("\n=== PREMATURE ROUND END ===");
        console.log("test:", test);
        console.log("move:", moves);
        console.log("player:", p);
        console.log("card:", card);
        console.log("result:", result);

        console.log("\nBEFORE:");
        console.dir(before, { depth: null });

        console.log("\nAFTER:");
        console.dir(snapshot(s), { depth: null });

        console.log("\nCOUNTS:");
        console.log({
          allCards,
          handCards,
          pileCards,
          deckCards: s.deck.length,
          sequenceCards: s.sequence.length
        });

        process.exit(1);
      }
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
    console.dir(snapshot(s), { depth: null });
    process.exit(1);
  }

  if (test % 1000 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nNO PREMATURE ROUND END FOUND");

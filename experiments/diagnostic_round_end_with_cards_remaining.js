const g = require("../src/game");

function snap(s) {
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

    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("\n=== EMPTY HAND ===");
      console.log("test:", test, "move:", moves);
      console.dir(snap(s), { depth: null });
      process.exit(1);
    }

    let card;

    if (!s.sequence.length) {
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
  }

  if (moves >= 300) {
    console.log("\n=== STUCK ===");
    console.log("test:", test);
    console.dir(snap(s), { depth: null });
    process.exit(1);
  }

  if (
    s.status === "round_finished" ||
    s.status === "round_draw" ||
    s.status === "game_finished"
  ) {
    const handCards =
      s.hands[0].length +
      s.hands[1].length;

    if (handCards !== 0) {
      console.log("\n=== PREMATURE ROUND END ===");
      console.log("test:", test);
      console.log("moves:", moves);
      console.log("hand cards remaining:", handCards);
      console.dir(snap(s), { depth: null });
      process.exit(1);
    }
  }

  if (test % 1000 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nNO PREMATURE ROUND END FOUND");

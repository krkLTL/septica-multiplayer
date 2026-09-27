const g = require("../src/game");

function score(cards) {
  return cards.filter(c => c === "A" || c === "10").length;
}

for (let test = 1; test <= 100; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;

  while (s.status === "playing" && moves < 300) {
    moves++;

    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("EMPTY HAND");
      console.dir(s, { depth: null });
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
  }

  if (moves >= 300) {
    console.log("STUCK");
    process.exit(1);
  }

  if (
    s.status === "round_finished" ||
    s.status === "round_draw" ||
    s.status === "game_finished"
  ) {
    const a = score(s.piles[0]);
    const b = score(s.piles[1]);

    console.log(
      `test ${test}: ${a}-${b} | ` +
      `A: ${s.piles[0].filter(c => c === "A" || c === "10").join(",")} | ` +
      `B: ${s.piles[1].filter(c => c === "A" || c === "10").join(",")}`
    );
  }
}

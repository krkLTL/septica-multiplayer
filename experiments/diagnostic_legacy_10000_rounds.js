const g = require("../src/game");

function snapshot(s) {
  return {
    turn: s.turn,
    status: s.status,
    deck: s.deck.length,
    handA: [...s.hands[0]],
    handB: [...s.hands[1]],
    sequence: [...s.sequence],
    starter: s.starter,
    pileA: s.piles[0].length,
    pileB: s.piles[1].length
  };
}

for (let test = 1; test <= 10000; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;
  const history = [];

  while (s.status === "playing" && moves < 300) {
    moves++;

    const before = snapshot(s);
    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("\n=== BUG FOUND ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("CURRENT STATE:");
      console.dir(snapshot(s), { depth: null });

      console.log("\n=== LAST 15 MOVES ===");
      console.dir(history.slice(-15), { depth: null });

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

    let result;

    try {
      result = g.playCard(s, p, card);
    } catch (e) {
      console.log("\n=== INVALID MOVE ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("player:", p);
      console.log("card:", card);
      console.log("error:", e.message);
      console.log("\nBEFORE:");
      console.dir(before, { depth: null });
      console.log("\nHISTORY:");
      console.dir(history.slice(-15), { depth: null });
      process.exit(1);
    }

    const after = snapshot(s);

    history.push({
      move: moves,
      player: p,
      card,
      result,
      before,
      after
    });

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
        const takeBefore = snapshot(s);

        try {
          const takeResult = g.take(s, current);

          history.push({
            move: moves + ".TAKE",
            player: current,
            result: takeResult,
            before: takeBefore,
            after: snapshot(s)
          });
        } catch (e) {
          console.log("\n=== TAKE FAILED ===");
          console.log("test:", test);
          console.log("move:", moves);
          console.log("error:", e.message);
          console.log("\nBEFORE TAKE:");
          console.dir(takeBefore, { depth: null });
          console.log("\nHISTORY:");
          console.dir(history.slice(-15), { depth: null });
          process.exit(1);
        }
      }
    }

    if (g.totalCards(s) !== 32) {
      console.log("\n=== CARD COUNT BUG ===");
      console.log("test:", test);
      console.log("move:", moves);
      console.log("TOTAL:", g.totalCards(s));
      console.log("\nCURRENT:");
      console.dir(snapshot(s), { depth: null });
      console.log("\nHISTORY:");
      console.dir(history.slice(-15), { depth: null });
      process.exit(1);
    }
  }

  if (moves >= 300) {
    console.log("\n=== STUCK GAME ===");
    console.log("test:", test);
    console.dir(snapshot(s), { depth: null });
    console.log("\nLAST 15 MOVES:");
    console.dir(history.slice(-15), { depth: null });
    process.exit(1);
  }

  if (test % 1000 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nDIAGNOSTIC PASSED");

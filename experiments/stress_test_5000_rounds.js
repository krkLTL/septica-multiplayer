const g = require("../src/game");

function show(s, label) {
  console.log("\n=== " + label + " ===");
  console.log("turn:", s.turn);
  console.log("status:", s.status);
  console.log("deck:", s.deck.length);
  console.log("hand A:", s.hands[0].join(" "));
  console.log("hand B:", s.hands[1].join(" "));
  console.log("sequence:", s.sequence.join(" -> "));
  console.log("piles:", s.piles[0].length, s.piles[1].length);
  console.log("TOTAL:", g.totalCards(s));

  if (g.totalCards(s) !== 32) {
    throw new Error("CARD COUNT BROKEN");
  }
}

for (let test = 1; test <= 5000; test++) {
  const s = g.newState();
  g.startRound(s);

  let moves = 0;

  while (s.status === "playing" && moves < 200) {
    moves++;

    const p = s.turn;
    const hand = s.hands[p];

    if (!hand.length) {
      console.log("\nBUG: player has no cards but game is still playing");
      show(s, "BROKEN");
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
      console.log("\nBUG: INVALID MOVE");
      console.log("test:", test, "move:", moves);
      console.log("player:", p);
      console.log("card:", card);
      console.log("error:", e.message);
      show(s, "BROKEN");
      process.exit(1);
    }

    if (s.status === "playing" && s.sequence.length >= 2) {
      const current = s.turn;
      const hand2 = s.hands[current];

      const legal =
        hand2.find(c => c === s.sequence[0]) ||
        hand2.find(c => c === "7");

      if (!legal && Math.random() < 0.5) {
        try {
          g.take(s, current);
        } catch (e) {
          console.log("\nBUG: TAKE FAILED");
          console.log("test:", test, "move:", moves);
          console.log("error:", e.message);
          show(s, "BROKEN");
          process.exit(1);
        }
      }
    }

    if (g.totalCards(s) !== 32) {
      console.log("\nBUG: CARD TOTAL CHANGED");
      console.log("test:", test, "move:", moves);
      show(s, "BROKEN");
      process.exit(1);
    }
  }

  if (moves >= 200) {
    console.log("\nBUG: GAME DID NOT PROGRESS");
    console.log("test:", test);
    show(s, "BROKEN");
    process.exit(1);
  }

  if (test % 500 === 0) {
    console.log("passed:", test);
  }
}

console.log("\nDIAGNOSTIC PASSED: 5000 SIMULATED ROUNDS");


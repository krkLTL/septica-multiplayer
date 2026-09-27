const g = require("../../src/game");

function snapshot(s) {
  return {
    status: s.status,
    turn: s.turn,
    deck: [...s.deck],
    hands: [[...s.hands[0]], [...s.hands[1]]],
    sequence: [...s.sequence],
    piles: [[...s.piles[0]], [...s.piles[1]]],
    starter: s.starter,
    roundResult: s.roundResult
  };
}

function playerName(p) {
  return p === 0 ? "X" : "Y";
}

function roleFor(s, p) {
  if (s.starter === null) {
    return "NEDEFINIT";
  }

  return p === s.starter ? "TĂIATUL" : "TĂIETORUL";
}

function playerLabel(s, p) {
  return `${playerName(p)} (${roleFor(s, p)})`;
}

function cardType(card, reper) {
  if (card === "7") return "7";
  if (card === reper) return "REPER";
  return "CARTOF";
}

function legalResponse(s, p) {
  if (s.sequence.length === 0) {
    return null;
  }

  const reper = s.sequence[0];
  const hand = s.hands[p];

  return (
    hand.find(c => c === reper) ||
    hand.find(c => c === "7") ||
    null
  );
}

function printStateLine(s) {
  console.log(
    `     Stare: X=${s.hands[0].length} | Y=${s.hands[1].length} | ` +
    `Pachet=${s.deck.length} | Teanc X=${s.piles[0].length} | ` +
    `Teanc Y=${s.piles[1].length} | Total=${g.totalCards(s)}`
  );
}

function printMove(entry) {
  const who = playerName(entry.player);

  console.log(
    `\n[${String(entry.move).padStart(2, "0")}] ` +
    `${who} (${entry.role})`
  );

  if (entry.action === "PLAY") {
    console.log(`     Reper: ${entry.reperBefore || "-"}`);
    console.log(`     Carte: ${entry.card} (${entry.cardType})`);
    console.log(
      `     Secvență înainte: ${
        entry.sequenceBefore.join(" → ") || "-"
      }`
    );
    console.log(`     Acțiune motor: ${entry.result.kind}`);

    if (entry.result.kind === "start") {
      console.log(`     >>> ÎNCEPE SECVENȚA`);
      console.log(
        `     TĂIATUL secvenței: ${playerName(entry.after.starter)}`
      );
      console.log(
        `     TĂIETORUL secvenței: ${
          playerName(1 - entry.after.starter)
        }`
      );
    }

    if (entry.result.kind === "continue") {
      console.log(`     >>> CONTINUĂ`);
      console.log(
        `     Urmează: ${playerLabel(entry.after, entry.after.turn)}`
      );
    }

    if (entry.result.kind === "surrender") {
      console.log(`     >>> CEDEAZĂ PRIN CARTE`);
      console.log(
        `     Câștigător secvență: ${playerLabel(
          entry.after,
          entry.result.winner
        )}`
      );
      console.log(
        `     Secvență câștigată: ${
          entry.sequenceBefore.concat(entry.card).join(" → ")
        }`
      );
    }

    console.log(
      `     Secvență după: ${
        entry.sequenceAfter.join(" → ") || "-"
      }`
    );

    printStateLine(entry.after);
  }

  if (entry.action === "TAKE") {
    console.log(`     Reper: ${entry.reperBefore || "-"}`);
    console.log(
      `     Secvență: ${entry.sequenceBefore.join(" → ")}`
    );
    console.log(`     Legal response disponibil: NU`);
    console.log(`     >>> TĂIATUL SPUNE „IA-LE”`);
    console.log(
      `     Câștigător secvență: ${playerLabel(
        entry.after,
        entry.result.winner
      )}`
    );
    console.log(
      `     Cărți câștigate: ${entry.sequenceBefore.length}`
    );

    printStateLine(entry.after);
  }
}

function printFullRoundFailure(test, history, finalState, title) {
  console.log(`\n\n========================================`);
  console.log(`!!! ${title} !!!`);
  console.log(`========================================`);
  console.log(`RUNDA: ${test}`);
  console.log(`MUTĂRI EXECUTATE: ${history.length}`);

  if (history.length) {
    const start = history[0].before;

    console.log(`\n========== START RUNDA ==========`);
    console.log(
      `X (${start.hands[0].length}): ${start.hands[0].join(" ")}`
    );
    console.log(
      `Y (${start.hands[1].length}): ${start.hands[1].join(" ")}`
    );
    console.log(`Pachet: ${start.deck.length}`);
  }

  console.log(`\n========== JURNAL COMPLET ==========`);
  for (const entry of history) {
    printMove(entry);
  }

  console.log(`\n========== STAREA FINALĂ / BUG ==========`);
  console.dir(finalState, { depth: null });

  console.log(`\n========== TOTAL CĂRȚI ==========`);
  console.log(g.totalCards(finalState));
}
let septicaCount = 0;
for (let test = 1; test <= 1000; test++) {
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
      printFullRoundFailure(
        test,
        history,
        before,
        "EMPTY HAND DURING PLAY"
      );
      process.exit(1);
    }

    /*
     * Dacă există deja o secvență, rolul este determinat
     * exclusiv de starter:
     *
     * starter = TĂIATUL
     * celălalt = TĂIETORUL
     */

    if (s.sequence.length >= 2) {
      const response = legalResponse(s, p);

      /*
       * TĂIATUL:
       *
       * Dacă nu are reper și nu are 7, NU joacă un cartof.
       * Este obligat să spună „IA-LE”.
       */
      if (p === s.starter && !response) {
        const beforeTake = snapshot(s);

        try {
          const takeResult = g.take(s, p);

          history.push({
            move: moves,
            action: "TAKE",
            player: p,
            role: "TĂIATUL",
            card: null,
            cardType: null,
            reperBefore: beforeTake.sequence[0],
            sequenceBefore: [...beforeTake.sequence],
            result: takeResult,
            sequenceAfter: [...s.sequence],
            before: beforeTake,
            after: snapshot(s)
          });
        } catch (e) {
          history.push({
            move: moves,
            action: "TAKE",
            player: p,
            role: "TĂIATUL",
            card: null,
            cardType: null,
            reperBefore: beforeTake.sequence[0],
            sequenceBefore: [...beforeTake.sequence],
            result: { error: e.message },
            sequenceAfter: [...s.sequence],
            before: beforeTake,
            after: snapshot(s)
          });

          printFullRoundFailure(
            test,
            history,
            snapshot(s),
            "TAKE FAILED"
          );

          console.log(`\nEroare: ${e.message}`);
          process.exit(1);
        }

        if (g.totalCards(s) !== 32) {
          printFullRoundFailure(
            test,
            history,
            snapshot(s),
            "CARD COUNT BUG AFTER TAKE"
          );
          process.exit(1);
        }

        continue;
      }
    }

    /*
     * Alegerea cărții.
     *
     * TĂIETORUL care nu are reper/7 este obligat să joace
     * o carte. Math.random() este folosit DOAR aici.
     */
    let card;

    if (s.sequence.length === 0) {
      // Prima carte din secvență.
      card = hand[0];
    } else {
      const response = legalResponse(s, p);

      if (response) {
        // Dacă poate continua, preferăm reperul, apoi 7.
        card = response;
      } else {
        // Aici poate ajunge doar TĂIETORUL.
        if (p === s.starter) {
          printFullRoundFailure(
            test,
            history,
            snapshot(s),
            "INTERNAL ROLE LOGIC ERROR: TĂIATUL FĂRĂ RĂSPUNS NU A FOST ÎNCHIS CU TAKE"
          );
          process.exit(1);
        }

        // TĂIETORUL trebuie să joace orice carte.
        const randomIndex = Math.floor(
          Math.random() * hand.length
        );

        card = hand[randomIndex];
      }
    }

    const role = roleFor(s, p);
    const reperBefore = s.sequence.length
      ? s.sequence[0]
      : null;
    const sequenceBefore = [...s.sequence];

    let result;

    try {
      result = g.playCard(s, p, card);
    } catch (e) {
      history.push({
        move: moves,
        action: "PLAY",
        player: p,
        role,
        card,
        cardType: cardType(card, reperBefore),
        reperBefore,
        sequenceBefore,
        result: { error: e.message },
        sequenceAfter: [...s.sequence],
        before,
        after: snapshot(s)
      });

      printFullRoundFailure(
        test,
        history,
        snapshot(s),
        "INVALID MOVE"
      );

      console.log(`\nEroare: ${e.message}`);
      process.exit(1);
    }

    history.push({
      move: moves,
      action: "PLAY",
      player: p,
      role,
      card,
      cardType: cardType(card, reperBefore),
      reperBefore,
      sequenceBefore,
      result,
      sequenceAfter: [...s.sequence],
      before,
      after: snapshot(s)
    });

    if (g.totalCards(s) !== 32) {
      printFullRoundFailure(
        test,
        history,
        snapshot(s),
        "CARD COUNT BUG"
      );

      console.log(`\nTOTAL: ${g.totalCards(s)}`);
      process.exit(1);
    }
  }

  if (moves >= 300) {
    printFullRoundFailure(
      test,
      history,
      snapshot(s),
      "STUCK ROUND"
    );
    process.exit(1);
  }

  const remaining =
    s.deck.length +
    s.hands[0].length +
    s.hands[1].length +
    s.sequence.length;

  if (s.status !== "playing" && !s.roundResult?.septica && remaining !== 0) {
    printFullRoundFailure(
      test,
      history,
      snapshot(s),
      "ROUND ENDED WITH CARDS OUTSIDE PILES"
    );

    console.log(
      `\nCărți rămase în afara teancurilor: ${remaining}`
    );
    process.exit(1);
  }

  if (s.roundResult?.septica) septicaCount++;

if (test % 100 === 0) {
  console.log(`passed: ${test}`);
}
}

console.log("\nDIAGNOSTIC PASSED: 1000 ROUNDS");
console.log(`ȘEPTICI DETECTATE: ${septicaCount}`);
console.log("Random TAKE decisions were preserved.");

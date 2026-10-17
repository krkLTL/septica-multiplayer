const VALUES = ["A", "K", "Q", "J", "10", "9", "8", "7"];
const SUITS = ["clubs", "diamonds", "hearts", "spades"];
const POINTS = new Set(["A", "10"]);

function rankOf(card) { return typeof card === "string" ? card : card?.rank; }
function sameCard(a, b) {
  if (a && typeof a === "object") return Boolean(b && typeof b === "object" ? a.id === b.id : a.id === b);
  return typeof b === "string" && a === b;
}
function findCard(hand, selection) {
  const exact = hand.findIndex(card => sameCard(card, selection));
  if (exact >= 0) return exact;
  // Rank-only support keeps old offline diagnostic fixtures readable. The
  // server and UI always send the stable physical-card ID.
  return typeof selection === "string" ? hand.findIndex(card => rankOf(card) === selection) : -1;
}

function makeDeck() {
  const d = [];

  for (const rank of VALUES) for (const suit of SUITS) d.push(Object.freeze({ id: `${rank}:${suit}`, rank, suit }));

  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }

  return d;
}

function points(a) {
  return a.reduce((n, c) => n + (POINTS.has(rankOf(c)) ? 1 : 0), 0);
}

function totalCards(s) {
  return (
    s.deck.length +
    s.hands[0].length +
    s.hands[1].length +
    s.sequence.length +
    s.piles[0].length +
    s.piles[1].length
  );
}

function assertInvariant(s) {
  const cards = [...s.deck, ...s.hands[0], ...s.hands[1], ...s.sequence, ...s.piles[0], ...s.piles[1]];
  const physicalCards = cards.some(card => card && typeof card === "object");
  if (cards.length !== 32) throw Error("CARD_INVARIANT");
  if (physicalCards) {
    const ids = cards.map(card => card && typeof card === "object" ? card.id : null);
    if (ids.some(id => !id) || new Set(ids).size !== 32) throw Error("CARD_IDENTITY_INVARIANT");
    if (cards.some(card => !VALUES.includes(card.rank) || !SUITS.includes(card.suit) || card.id !== `${card.rank}:${card.suit}`)) throw Error("CARD_IDENTITY_INVARIANT");
  }
  for (const rank of VALUES) if (cards.filter(card => rankOf(card) === rank).length !== 4) throw Error(`CARD_RANK_INVARIANT:${rank}`);
}

function newState() {
  return {
    deck: [],
    hands: [[], []],
    sequence: [],
    piles: [[], []],

    // starter = player who started the current sequence (TAIATUL).
    // turn = player who currently has the decision.
    starter: null,
    turn: null,

    status: "waiting",
    round: 1,
    game: 1,

    small: [0, 0],
    big: [0, 0],

    // gameStarter = player who started the first round of the current game.
    // lastSequenceWinner = winner of the most recently resolved sequence.
    gameStarter: null,
    lastSequenceWinner: null,
    lastAction: null,

    roundDouble: false,
    roundResult: null,
    gameResult: null,
    septica: null
  };
}

function septicaWinner(s) {
  for (let p = 0; p < 2; p++) {
    if (s.hands[p].filter(c => rankOf(c) === "7").length === 4) return p;
  }
  return null;
}

function finishGame(s, winner, reason = "round") {
  s.big[winner] += 1;
  s.gameResult = { winner, game: s.game, reason };
  s.small = [0, 0];
  s.game += 1;
  s.status = "game_finished";
}

function beginAfterSeptica(s, winner) {
  s.small[winner] += 2;
  if (s.small[winner] >= 3) {
    s.big[winner] += 1;
    s.small = [0, 0];
    s.game += 1;
    s.round = 1;
    s.gameStarter = winner;
  } else {
    s.round += 1;
  }
  startRound(s, false, winner);
}

function startRound(s, doubleRound = false, startingPlayer = null) {
  s.deck = makeDeck();
  s.hands = [[], []];
  s.sequence = [];
  s.piles = [[], []];

  s.starter = null;
  s.turn = startingPlayer === null
    ? (Math.random() < 0.5 ? 0 : 1)
    : startingPlayer;

  // The first round of a game establishes that game's initial starter.
  // nextRound() updates this field explicitly when a new game begins.
  if (s.gameStarter === null) s.gameStarter = s.turn;
  s.lastSequenceWinner = null;
  s.lastAction = null;

  s.roundDouble = doubleRound;
  s.roundResult = null;
  s.gameResult = null;
  s.septica = null;
  s.status = "playing";

  for (let i = 0; i < 4; i++) {
    s.hands[0].push(s.deck.pop());
    s.hands[1].push(s.deck.pop());
  }

  const sw = septicaWinner(s);

  if (sw !== null) {
    s.septica = sw;
    beginAfterSeptica(s, sw);
  }

  assertInvariant(s);
}

function canPlay(s, p, c) {
  if (s.status !== "playing") return false;
  if (s.turn !== p) return false;
  const index = findCard(s.hands[p], c);
  if (index < 0) return false;
  const selected = s.hands[p][index];

  // TĂIATUL may continue with the reper or 7.
  // A different card would be a concession by card, which is allowed
  // only for TĂIETORUL. TĂIATUL must say "Ia-le" instead.
  if (s.sequence.length >= 2 && s.starter === p) {
    const initial = s.sequence[0];
    if (rankOf(selected) !== rankOf(initial) && rankOf(selected) !== "7") return false;
  }

  return true;
}

// Refill both hands toward 4, alternating starting with the sequence winner.
// This produces the fixed distributions:
// 0/0 + 8 -> 4/4
// 1/1 + 6 -> 4/4
// 2/2 + 4 -> 4/4
// 3/3 + 2 -> 4/4
// and the equivalent 1/1+4, 2/2+2, etc.
function draw(s, w) {
  const o = 1 - w;
  let p = w;

  while (
    s.deck.length > 0 &&
    (s.hands[w].length < 4 || s.hands[o].length < 4)
  ) {
    if (s.hands[p].length < 4) s.hands[p].push(s.deck.pop());

    p = 1 - p;

    if (s.hands[w].length >= 4 && s.hands[o].length < 4) p = o;
    if (s.hands[o].length >= 4 && s.hands[w].length < 4) p = w;
  }
}

function finishRound(s) {
  const p0 = points(s.piles[0]);
  const p1 = points(s.piles[1]);

  s.roundResult = {
    points: [p0, p1],
    winner: null,
    draw: false,
    double: s.roundDouble,
    septica: false
  };

  if (p0 === p1) {
    s.roundResult.draw = true;
    s.status = "round_draw";
    return;
  }

  const w = p0 > p1 ? 0 : 1;
  s.roundResult.winner = w;
  s.small[w] += s.roundDouble ? 2 : 1;

  if (s.small[w] >= 3) finishGame(s, w, "round");
  else s.status = "round_finished";
}

function finishSequence(s, w) {
  s.lastSequenceWinner = w;
  s.piles[w].push(...s.sequence);
  s.sequence = [];
  s.starter = null;

  if (
    !s.deck.length &&
    !s.hands[0].length &&
    !s.hands[1].length
  ) {
    finishRound(s);
    assertInvariant(s);
    return;
  }

  draw(s, w);

  const sw = septicaWinner(s);
  if (sw !== null) {
    s.septica = sw;
    beginAfterSeptica(s, sw);
    assertInvariant(s);
    return;
  }

  if (
    !s.deck.length &&
    !s.hands[0].length &&
    !s.hands[1].length
  ) {
    finishRound(s);
    assertInvariant(s);
    return;
  }

  s.turn = w;
  assertInvariant(s);
}

function playCard(s, p, c) {
  if (!canPlay(s, p, c)) throw Error("INVALID_MOVE");

  const index = findCard(s.hands[p], c);
  const played = s.hands[p].splice(index, 1)[0];
  s.sequence.push(played);
  s.lastAction = { type: "play", card: played, sequence: [...s.sequence], winner: null };

  // First card starts the sequence.
  if (s.sequence.length === 1) {
    s.starter = p;
    s.turn = 1 - p;

    assertInvariant(s);

    return { kind: "start", player: p, card: played };
  }

  const initial = s.sequence[0];

  // 7 or the initial value continues/cuts the sequence.
  const cont = rankOf(played) === rankOf(initial) || rankOf(played) === "7";

  // Any other card is a concession-by-card.
  // The player who played it has made the decision; there is no
  // additional decision after this card.
  if (!cont) {
    const w = s.starter;
    const sequence = [...s.sequence];

    finishSequence(s, w);
    if (s.lastAction) s.lastAction.winner = w;

    return {
      kind: "surrender",
      player: p,
      card: played,
      winner: w,
      sequence
    };
  }

  const nextPlayer = 1 - p;

  /*
   * FINAL-SEQUENCE FIX:
   *
   * If the deck is empty and the next player has no cards, the
   * sequence cannot continue. The player who just played the final
   * legal card wins this sequence.
   *
   * Example:
   * A:10 -> B:10 -> A:10 -> B:7
   * If A has 0 cards and the deck is empty, B wins the sequence.
   *
   * The previous implementation incorrectly awarded it to
   * s.starter.
   */
  if (!s.deck.length && !s.hands[nextPlayer].length) {
    const w = p;
    const sequence = [...s.sequence];

    finishSequence(s, w);
    if (s.lastAction) s.lastAction.winner = w;

    return {
      kind: "continue",
      player: p,
      card: played,
      winner: w,
      sequence,
      final: true
    };
  }

  // The player who was just cut now has the decision.
  s.turn = nextPlayer;

  assertInvariant(s);

  return {
    kind: "continue",
    player: p,
    card: c
  };
}

function take(s, p) {
  if (
    s.status !== "playing" ||
    s.turn !== p ||
    s.sequence.length < 2
  ) {
    throw Error("INVALID_TAKE");
  }

  if (s.starter !== p) {
    throw Error("INVALID_TAKE_ROLE");
  }

  const w = 1 - p;
  const sequence = [...s.sequence];

  s.lastAction = {
    type: "take",
    sequence: [...sequence],
    winner: w,
    player: p
  };

  finishSequence(s, w);

  return {
    kind: "take",
    player: p,
    winner: w,
    sequence
  };
}

function nextRound(s) {
  if (
    s.status !== "round_finished" &&
    s.status !== "round_draw" &&
    s.status !== "game_finished"
  ) {
    throw Error("ROUND_NOT_FINISHED");
  }

  if (s.status === "game_finished") {
    const previousGameWasDouble = Boolean(s.roundResult?.double);
    const startingPlayer = previousGameWasDouble
      ? s.gameResult.winner
      : 1 - s.gameStarter;

    s.round = 1;
    s.gameStarter = startingPlayer;
    startRound(s, false, startingPlayer);
    return;
  }

  const wasDraw = s.status === "round_draw";
  const startingPlayer = wasDraw
    ? s.lastSequenceWinner
    : s.roundResult.winner;

  s.round += 1;
  startRound(s, wasDraw, startingPlayer);
}

module.exports = {
  makeDeck,
  rankOf,
  cardId: card => card && typeof card === "object" ? card.id : null,
  points,
  totalCards,
  assertInvariant,
  newState,
  startRound,
  canPlay,
  playCard,
  take,
  nextRound,
  septicaWinner
};

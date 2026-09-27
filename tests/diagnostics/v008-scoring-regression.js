const g = require("../../src/game");

function assert(c, m) {
  if (!c) throw new Error("FAIL: " + m);
}

assert(g.points(["A", "10", "K", "Q", "J", "9", "8", "7"]) === 2,
  "A and 10 must each score 1");

assert(g.points(["A", "A", "10", "10"]) === 4,
  "four scoring cards must score 4");

assert(g.points(["K", "Q", "J", "9", "8", "7"]) === 0,
  "non-scoring ranks must score 0");

const pileA = ["A", "10", "K", "Q"];
const pileB = ["A", "10", "J", "9"];
const scoreA = g.points(pileA);
const scoreB = g.points(pileB);

assert(scoreA === 2 && scoreB === 2, "pile scoring must use final piles only");
assert(scoreA + scoreB === 4, "fixture score must equal four scoring cards");

const fullA = ["A", "A", "10", "10", "K", "Q"];
const fullB = ["A", "A", "10", "10", "J", "9"];
assert(g.points(fullA) + g.points(fullB) === 8,
  "all eight Aces/Tens must account for eight points");

console.log("PASS: v008 scoring regression");

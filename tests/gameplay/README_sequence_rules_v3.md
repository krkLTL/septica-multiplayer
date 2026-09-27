# Multiplayer v3 — Sequence Rules

Terminology:

- A = tăiatul — player who starts the sequence.
- B = tăietorul — player who responds.
- reper — first card played in the sequence (`sequence[0]`).
- 7 — special card that can continue any sequence.
- cartof — ordinary card that is neither the reper nor 7.

The sequence test deliberately uses K, Q, J, 10 and 8 as different reper
values, so the rule cannot accidentally become hard-coded to K.

The uploaded Multiplayer v2 is the basis for this build.

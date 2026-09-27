# v010 — Sequence / Piece Acceptance Tests

These tests encode the confirmed model:

- A sequence is one resolved unit.
- A sequence may contain multiple pieces.
- A piece is a TĂIATUL card followed by the TĂIETORUL response.
- Roles do not switch inside the same sequence.
- A 7 or the initial value continues the same sequence into another piece.
- TĂIATUL can continue or say „Ia-le”.
- TĂIETORUL must answer with a card; a non-continuing card is a concession-by-card.
- After the whole sequence resolves, the winner refills first and starts the next sequence as the TĂIATUL.
- These tests do not modify `src/game.js`.

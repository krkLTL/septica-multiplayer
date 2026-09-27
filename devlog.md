Șeptică — Role/TAKE/concession fix

Applied changes:
1. v002 endgame condition remains correct: the round ends only when deck=0 and BOTH hands are empty.
2. `take()` is now restricted to the current TĂIATUL (`starter`). TĂIETORUL cannot TAKE.
3. `canPlay()` now forbids the current TĂIATUL from playing a non-cutting card (anything other than the initial value or 7). The TĂIATUL must say `Ia-le` instead.
4. Cedarea prin carte remains a TĂIETORUL action: a response that is neither the initial value nor 7 gives the sequence to the current TĂIATUL.
5. Roles remain fixed inside one sequence. After the sequence resolves, its winner starts the next sequence and therefore becomes the new TĂIATUL.
6. v002-v009 regression fixtures were kept valid; v002/v006/v007 were rewritten to avoid duplicated ranks outside the real 4-per-rank deck and to test the clarified rules.

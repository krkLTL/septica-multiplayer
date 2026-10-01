# Șeptică Multiplayer UI MVP

Replace the existing `public/index.html` in the multiplayer project with the supplied file.

The UI is wired to the existing Socket.IO events from `server.js`:
- `create_room`
- `join_room`
- `play_card`
- `take`
- `next_round`
- `state`
- `room_created`
- `room_joined`
- `error_message`
- `opponent_disconnected`

It does not change `src/game.js` or `server.js`.

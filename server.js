const path=require("path"),express=require("express"),http=require("http"),{Server}=require("socket.io"),game=require("./src/game");
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map();app.use(express.static(path.join(__dirname,"public")));
function code(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let x;do{x=Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join("")}while(rooms.has(x));return x}
function room(s){return s.data.room?rooms.get(s.data.room):null}
function pub(r,p){
  const s=r.state;

  return {
    room:r.code,
    player:p,
    players:r.players.map(Boolean),

    status:s.status,
    round:s.round,
    game:s.game,

    small:[...s.small],
    big:[...s.big],

    roundDouble:s.roundDouble,
    roundResult:s.roundResult,
    gameResult:s.gameResult,

    deck:s.deck.length,

    hand:[...s.hands[p]],
    opponentCount:s.hands[1-p].length,

    sequence:[...s.sequence],
    turn:s.turn,

    pileCounts:[
      s.piles[0].length,
      s.piles[1].length
    ],

    pilePoints:[
      game.points(s.piles[0]),
      game.points(s.piles[1])
    ],

    log:r.log.slice(-100)
  };
}
function log(r,t){r.log.push(t);if(r.log.length>120)r.log.shift()}
function broadcast(r){r.players.forEach((id,p)=>id&&io.to(id).emit("state",pub(r,p)))}
function ready(r){if(r.players[0]&&r.players[1]&&r.state.status==="waiting"){game.startRound(r.state);log(r,`========== RUNDA ${r.state.round} ==========`);log(r,"A: 4 cărți | B: 4 cărți | Pachet: 24");log(r,r.state.turn===0?"A începe runda.":"B începe runda.");broadcast(r)}}
io.on("connection",s=>{
s.on("create_room",()=>{if(s.data.room)return;const c=code(),r={code:c,players:[s.id,null],state:game.newState(),log:[]};rooms.set(c,r);s.data.room=c;s.data.player=0;s.emit("room_created",{code:c,player:0});broadcast(r)});
s.on("join_room",raw=>{if(s.data.room)return;const c=String(raw||"").trim().toUpperCase(),r=rooms.get(c);if(!r)return s.emit("error_message","Camera nu există.");if(r.players[1])return s.emit("error_message","Camera este plină.");r.players[1]=s.id;s.data.room=c;s.data.player=1;s.emit("room_joined",{code:c,player:1});ready(r);broadcast(r)});
s.on("play_card",card=>{const r=room(s);if(!r)return;try{const p=s.data.player,res=game.playCard(r.state,p,String(card)),who=p?"B":"A";if(res.kind==="start")log(r,`${who} începe secvența cu ${res.card}.`);else if(res.kind==="continue")log(r,`${who} răspunde cu ${res.card} — continuă secvența.`);else{log(r,`${who} răspunde cu ${res.card} — cedează prin carte.`);log(r,`${res.winner?"B":"A"} câștigă secvența.`)}if(r.state.status!=="playing"){const q=r.state.roundResult;if(q.draw)log(r,`===== FINAL RUNDA ${r.state.round} ===== Egalitate ${q.points[0]}–${q.points[1]}. Joc dublu.`);else log(r,`===== FINAL RUNDA ${r.state.round} ===== Puncte: A ${q.points[0]} – B ${q.points[1]}. ${q.winner?"B":"A"} câștigă runda.`)}broadcast(r)}catch(e){s.emit("error_message",e.message)}});
s.on("take",()=>{
  const r=room(s);
  if(!r)return;

  try{
    const p=s.data.player;
    const who=p?"B":"A";

    const taker=p;
    const cutter=1-p;

    const sequenceBefore=[...r.state.sequence];
    const pileBefore=[
      r.state.piles[0].length,
      r.state.piles[1].length
    ];
    const handBefore=[
      r.state.hands[0].length,
      r.state.hands[1].length
    ];
    const deckBefore=r.state.deck.length;

    console.log("");
    console.log("========================================");
    console.log("MULTIPLAYER TAKE TRACE");
    console.log("========================================");
    console.log("Jucator TAKE:",who);
    console.log("TAIATUL:",taker?"B":"A");
    console.log("TAIETORUL:",cutter?"B":"A");
    console.log("Secventa:",sequenceBefore.join(" -> "));
    console.log("Maini inainte: A="+handBefore[0]+" | B="+handBefore[1]);
    console.log("Gramezi inainte: A="+pileBefore[0]+" | B="+pileBefore[1]);
    console.log("Pachet inainte:",deckBefore);

    const res=game.take(r.state,p);

    const pileAfter=[
      r.state.piles[0].length,
      r.state.piles[1].length
    ];
    const handAfter=[
      r.state.hands[0].length,
      r.state.hands[1].length
    ];
    const deckAfter=r.state.deck.length;

    console.log("");
    console.log("RESULTAT ENGINE");
    console.log("Winner:",res.winner?"B":"A");
    console.log("Secventa castigata:",res.sequence.join(" -> "));
    console.log("Maini dupa: A="+handAfter[0]+" | B="+handAfter[1]);
    console.log("Gramezi dupa: A="+pileAfter[0]+" | B="+pileAfter[1]);
    console.log("Pachet dupa:",deckAfter);
    console.log("========================================");
    console.log("");

    log(r,`${who} spune: „Ia-le”.`);
    log(r,`${res.winner?"B":"A"} câștigă secvența: ${res.sequence.join(" → ")}`);

    if(r.state.status!=="playing"){
      const q=r.state.roundResult;

      if(q.draw)
        log(r,`===== FINAL RUNDA ${r.state.round} ===== Egalitate ${q.points[0]}–${q.points[1]}. Joc dublu.`);
      else
        log(r,`===== FINAL RUNDA ${r.state.round} ===== Puncte: A ${q.points[0]} – B ${q.points[1]}. ${q.winner?"B":"A"} câștigă runda.`);
    }

    broadcast(r);

  }catch(e){
    console.error("TAKE ERROR:",e);
    s.emit("error_message",e.message);
  }
});
s.on("next_round",()=>{const r=room(s);if(!r||s.data.player!==0)return;try{game.nextRound(r.state);log(r,`========== RUNDA ${r.state.round} ==========`);log(r,"A: 4 cărți | B: 4 cărți | Pachet: 24");log(r,r.state.turn===0?"A începe runda.":"B începe runda.");broadcast(r)}catch(e){s.emit("error_message",e.message)}});
s.on("disconnect",()=>{const r=room(s);if(!r)return;const p=s.data.player;r.players[p]=null;r.state.status="waiting";log(r,`${p?"B":"A"} s-a deconectat.`);r.players.forEach(id=>id&&io.to(id).emit("opponent_disconnected"));if(!r.players[0]&&!r.players[1])rooms.delete(r.code);else broadcast(r)})
});
server.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log("Șeptică multiplayer v2 listening on http://0.0.0.0:3000"));




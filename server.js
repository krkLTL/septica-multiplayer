const path=require("path"),express=require("express"),http=require("http"),{Server}=require("socket.io"),game=require("./src/game");
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map(),ai=require("./src/ai");
app.disable("x-powered-by");
app.use((req,res,next)=>{
  if(req.path==="/"||req.path.endsWith(".html")) res.set("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});
app.use(express.static(path.join(__dirname,"public"),{etag:false,maxAge:0}));
function code(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let x;do{x=Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join("")}while(rooms.has(x));return x}
function room(s){return s.data.room?rooms.get(s.data.room):null}
function pub(r,p,lastAction=r.state.lastAction){
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
    starter:s.starter,
    lastAction,
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
function cardLabel(card){return card?.rank||String(card||"")}
function ensureStarted(r){
  if(r.players[0]&&r.players[1]&&r.state.status==="waiting"){
    game.startRound(r.state);
    log(r,`========== RUNDA ${r.state.round} ==========`);
    log(r,"A: 4 cărți | B: 4 cărți | Pachet: 24");
    log(r,r.state.turn===0?"A începe runda.":"B începe runda.");
    traceState(r,"START MECI");
  }
}
function traceState(r,label){
  const s=r.state;
  const hand=(p)=>`${s.hands[p].map(cardLabel).join(" ")} | 7=${s.hands[p].filter(c=>game.rankOf(c)==="7").length}`;
  console.log(`[${label}] Partidă: A ${s.big[0]} – ${s.big[1]} B | Runda: A ${s.small[0]} – ${s.small[1]} B | joc=${s.game} runda=${s.round} status=${s.status}`);
  console.log(`[${label}] Mâini A(${s.hands[0].length}): ${hand(0)} || B(${s.hands[1].length}): ${hand(1)}`);
  console.log(`[${label}] Pachet=${s.deck.length} | Grămezi A=${s.piles[0].length} (${game.points(s.piles[0])}p) B=${s.piles[1].length} (${game.points(s.piles[1])}p) | turn=${s.turn===null?"-":s.turn?"B":"A"} starter=${s.starter===null?"-":s.starter?"B":"A"}`);
  console.log(`[${label}] Septică=${s.septica===null?"nu":s.septica?"B":"A"} | ultimul câștigător=${s.lastSequenceWinner===null?"-":s.lastSequenceWinner?"B":"A"} | roundResult=${JSON.stringify(s.roundResult)}`);
}
function broadcast(r,lastAction){ensureStarted(r);r.players.forEach((id,p)=>id&&id!=="AI"&&io.to(id).emit("state",pub(r,p,lastAction)));if(r.bot)runAiTurn(r)}
function ready(r){ensureStarted(r)}
function runAiTurn(r){
  if(!r.bot||!r.players[0]||r.state.status!=="playing"||r.state.turn!==1)return;
  clearTimeout(r.aiTimer);
  r.aiTimer=setTimeout(()=>{
    if(!r.bot||!r.players[0]||r.state.status!=="playing"||r.state.turn!==1)return;
    try{
      const turn=ai.playTurn(r.state,1,r.difficulty);
      if(turn.action.type==="play") log(r,`AI (${r.difficulty}) joacă ${cardLabel(turn.action.card)}.`);
      else if(turn.action.type==="take") log(r,`AI (${r.difficulty}) spune: „Ia-le”.`);
      traceState(r,"DUPĂ MUTAREA AI");
      broadcast(r);
      runAiTurn(r);
    }catch(e){console.error("AI TURN ERROR:",e);}
  },650);
}
io.on("connection",s=>{
s.on("create_room",()=>{if(s.data.room)return;const c=code(),r={code:c,players:[s.id,null],state:game.newState(),log:[]};rooms.set(c,r);s.data.room=c;s.data.player=0;s.emit("room_created",{code:c,player:0});s.emit("state",pub(r,0));broadcast(r)});
s.on("create_pve",difficulty=>{if(s.data.room)return;const c=code(),r={code:c,players:[s.id,"AI"],state:game.newState(),log:[],bot:true,difficulty:ai.normalizeDifficulty(difficulty)};rooms.set(c,r);s.data.room=c;s.data.player=0;s.emit("room_created",{code:c,player:0,mode:"pve",difficulty:r.difficulty});ensureStarted(r);broadcast(r);runAiTurn(r)});
s.on("join_room",raw=>{if(s.data.room)return;const c=String(raw||"").trim().toUpperCase(),r=rooms.get(c);if(!r)return s.emit("error_message","Camera nu există.");if(r.players[1])return s.emit("error_message","Camera este plină.");r.players[1]=s.id;s.data.room=c;s.data.player=1;s.emit("room_joined",{code:c,player:1});ready(r);broadcast(r)});
s.on("leave_room",ack=>{const r=room(s);if(!r){if(typeof ack==="function")ack();return}clearTimeout(r.aiTimer);rooms.delete(r.code);for(const id of r.players){if(!id||id==="AI")continue;const peer=io.sockets.sockets.get(id);if(!peer)continue;peer.data.room=null;peer.data.player=null;if(peer.id!==s.id)peer.emit("room_closed")}if(typeof ack==="function")ack()});
s.on("play_card",cardId=>{const r=room(s);if(!r)return;try{if(typeof cardId!=="string"||!cardId.includes(":"))throw Error("INVALID_CARD_ID");const p=s.data.player,res=game.playCard(r.state,p,cardId),who=p?"B":"A";if(res.kind==="start")log(r,`${who} începe secvența cu ${cardLabel(res.card)}.`);else if(res.kind==="continue")log(r,`${who} răspunde cu ${cardLabel(res.card)} — continuă secvența.`);else{log(r,`${who} răspunde cu ${cardLabel(res.card)} — cedează prin carte.`);log(r,`${res.winner?"B":"A"} câștigă secvența.`)}if(r.state.status!=="playing"){const q=r.state.roundResult;if(q.draw)log(r,`===== FINAL RUNDA ${r.state.round} ===== Egalitate ${q.points[0]}–${q.points[1]}. Joc dublu.`);else log(r,`===== FINAL RUNDA ${r.state.round} ===== Puncte: A ${q.points[0]} – B ${q.points[1]}. ${q.winner?"B":"A"} câștigă runda.`)}traceState(r,"DUPĂ CARTE");broadcast(r)}catch(e){s.emit("error_message",e.message)}});
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
    traceState(r,"ÎNAINTE TAKE");

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
    console.log("Secventa castigata:",res.sequence.map(cardLabel).join(" -> "));
    console.log("Maini dupa: A="+handAfter[0]+" | B="+handAfter[1]);
    console.log("Gramezi dupa: A="+pileAfter[0]+" | B="+pileAfter[1]);
    console.log("Pachet dupa:",deckAfter);
    traceState(r,"DUPĂ TAKE");
    console.log("========================================");
    console.log("");

    log(r,`${who} spune: „Ia-le”.`);
    log(r,`${res.winner?"B":"A"} câștigă secvența: ${res.sequence.map(cardLabel).join(" → ")}`);

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
s.on("next_round",()=>{const r=room(s);if(!r||s.data.player!==0)return;try{game.nextRound(r.state);log(r,`========== RUNDA ${r.state.round} ==========`);log(r,"A: 4 cărți | B: 4 cărți | Pachet: 24");log(r,r.state.turn===0?"A începe runda.":"B începe runda.");traceState(r,"DUPĂ RUNDA NOUĂ");broadcast(r);runAiTurn(r)}catch(e){s.emit("error_message",e.message)}});
s.on("reconnect_room",raw=>{
  if(s.data.room)return;
  const c=String(raw?.code||"").trim().toUpperCase(),p=Number(raw?.player),r=rooms.get(c);
  if(!r||!(p===0||p===1))return s.emit("error_message","Camera nu mai este disponibilă.");
  if(r.players[p]&&r.players[p]!==s.id)return s.emit("error_message","Locul jucătorului este ocupat.");
  r.players[p]=s.id;s.data.room=c;s.data.player=p;log(r,`${p?"B":"A"} s-a reconectat.`);
  s.emit("room_rejoined",{code:c,player:p});ready(r);broadcast(r);
});
s.on("disconnect",()=>{const r=room(s);if(!r)return;const p=s.data.player;if(r.players[p]!==s.id)return;r.players[p]=null;log(r,`${p?"B":"A"} s-a deconectat.`);r.players.forEach(id=>id&&io.to(id).emit("opponent_disconnected"));if(!r.players[0]&&!r.players[1])rooms.delete(r.code);else broadcast(r)})
});
server.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log("Șeptică multiplayer v2 listening on http://0.0.0.0:3000"));

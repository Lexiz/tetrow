import { useState } from "react";

const C = {
  bg:      "#050508",
  panel:   "#09090f",
  border:  "#18182a",
  p1:      "#ff7a00",
  p1b:     "#ffaa44",
  p1dim:   "#ff7a0022",
  p2:      "#00e5ff",
  p2b:     "#66f4ff",
  p2dim:   "#00e5ff22",
  text:    "#dde0f5",
  dim:     "#30304a",
  grid:    "#0a0a12",
  white:   "#ffffff",
};

const CELL = 23;
const COLS = 10;
const ROWS = 20;

function makeSampleBoard() {
  const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  [
    [18,[0,1,2,3,4,5,6,7,8],[1,1,1,2,2,2,1,2,1]],
    [17,[0,1,2,3,5,6,7,8,9],[2,2,1,1,2,1,1,2,2]],
    [16,[0,1,2,4,5,6,7,8,9],[1,1,2,2,1,2,2,1,1]],
    [15,[0,1,3,4,5,6,7,9],  [2,1,1,2,1,1,2,2]],
    [14,[0,2,3,4,5,8,9],    [1,2,1,2,1,2,1]],
    [13,[0,1,2,3,7,8],      [2,2,1,1,1,2]],
    [12,[0,1,4,5,6],        [1,2,2,1,2]],
    [11,[0,3,4],            [2,1,2]],
  ].forEach(([row, cols, owners]) =>
    cols.forEach((c, i) => { b[row][c] = owners[i]; })
  );
  b[10][4]="a"; b[10][5]="a"; b[10][6]="a"; b[11][5]="a";
  b[13][4]="g"; b[13][5]="g"; b[13][6]="g"; b[14][5]="g";
  return b;
}

function Cell({ v }) {
  if (!v) return (
    <div style={{
      width: CELL, height: CELL, boxSizing: "border-box",
      background: C.grid,
      borderRight: `1px solid #0e0e1c`,
      borderBottom: `1px solid #0e0e1c`,
    }}/>
  );

  if (v === "g") return (
    <div style={{
      width: CELL, height: CELL, boxSizing: "border-box",
      background: `radial-gradient(ellipse at 40% 35%, rgba(255,122,0,0.18) 0%, rgba(255,122,0,0.06) 70%, transparent 100%)`,
      border: `1.5px solid rgba(255,122,0,0.45)`,
      boxShadow: `inset 0 0 8px rgba(255,122,0,0.15), 0 0 6px rgba(255,122,0,0.25)`,
    }}/>
  );

  const isP1 = v === 1 || v === "a";
  const col  = isP1 ? C.p1  : C.p2;
  const brt  = isP1 ? C.p1b : C.p2b;

  return (
    <div style={{
      width: CELL, height: CELL, boxSizing: "border-box", position: "relative",
      background: `radial-gradient(ellipse at 40% 35%, ${col}ff 0%, ${col}cc 35%, ${col}77 65%, ${col}33 100%)`,
      border: `1.5px solid ${brt}`,
      boxShadow: `
        inset 0 0 10px ${col}99,
        inset 0 0  4px ${brt}88,
        0 0  8px ${col}aa,
        0 0 16px ${col}55,
        0 0  2px ${brt}
      `,
      overflow: "hidden",
    }}>
      <div style={{ position:"absolute", top:1, left:2, right:2, height:"35%",
        background:`linear-gradient(to bottom, ${C.white}44, transparent)`,
        borderRadius:1 }}/>
    </div>
  );
}

function Board({ board }) {
  return (
    <div style={{
      display:"inline-grid",
      gridTemplateColumns:`repeat(${COLS},${CELL}px)`,
      border:`2px solid #222238`,
      borderRadius:3,
      background: C.grid,
      boxShadow:`
        0 0  60px rgba(255,122,0,0.12),
        0 0 100px rgba(0,229,255,0.08),
        0 0 180px rgba(255,122,0,0.05),
        inset 0 0  50px rgba(0,0,0,0.8)
      `,
    }}>
      {board.map((row,r)=>row.map((v,c)=><Cell key={`${r}-${c}`} v={v}/>))}
    </div>
  );
}

function MiniPiece({ piece, col, brt }) {
  const g = Array.from({length:4},()=>Array(4).fill(false));
  piece.forEach(([x,y])=>{ if(g[y]) g[y][x]=true; });
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,13px)",gap:1}}>
      {g.map((row,r)=>row.map((on,c)=>(
        <div key={`${r}-${c}`} style={{
          width:13, height:13, position:"relative", overflow:"hidden",
          background: on
            ? `radial-gradient(ellipse at 40% 35%, ${col}ff 0%, ${col}cc 40%, ${col}66 100%)`
            : "transparent",
          border: on ? `1.5px solid ${brt}` : `1px solid #0e0e1e`,
          borderRadius:1,
          boxShadow: on ? `inset 0 0 6px ${col}88, 0 0 6px ${col}bb, 0 0 12px ${col}44` : "none",
        }}>
          {on && <div style={{ position:"absolute", top:1, left:1, right:1, height:"32%",
            background:`linear-gradient(to bottom, ${C.white}44, transparent)`, borderRadius:1 }}/>}
        </div>
      )))}
    </div>
  );
}

function SpeedBar({ band, col }) {
  return (
    <div style={{display:"flex",gap:3,alignItems:"flex-end",height:20}}>
      {Array.from({length:7}).map((_,i)=>(
        <div key={i} style={{
          width:7,
          height: i<=band ? 5+i*2.4 : 4,
          background: i<=band ? col : "#14142a",
          borderRadius:1,
          boxShadow: i<=band ? `0 0 6px ${col}cc, 0 0 10px ${col}55` : "none",
          transition:"all 0.3s",
        }}/>
      ))}
    </div>
  );
}

function Panel({ player, score, speed, band, piece, active }) {
  const col = player===1 ? C.p1 : C.p2;
  const brt = player===1 ? C.p1b : C.p2b;
  const dim = player===1 ? C.p1dim : C.p2dim;

  return (
    <div style={{
      width:152,
      background: active
        ? `linear-gradient(150deg, ${col}14 0%, ${C.panel} 50%)`
        : C.panel,
      border: `1.5px solid ${active ? col+"aa" : "#1a1a2c"}`,
      borderRadius:8, padding:16,
      display:"flex", flexDirection:"column", gap:16,
      boxShadow: active ? `
        0 0 24px ${col}44,
        0 0 48px ${col}22,
        0 0  8px ${col}66,
        inset 0 0 30px ${col}0a
      ` : "none",
      transition:"all 0.4s ease",
    }}>

      {/* header */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{
          width:10,height:10,borderRadius:"50%",
          background: col,
          boxShadow: active
            ? `0 0 10px ${col}, 0 0 20px ${col}aa, 0 0 30px ${col}55`
            : `0 0 4px ${col}66`,
          transition:"box-shadow 0.4s",
        }}/>
        <span style={{
          color: active ? brt : C.dim,
          fontFamily:"'Courier New',monospace",
          fontSize:12,fontWeight:700,letterSpacing:2,
          textShadow: active ? `0 0 12px ${col}` : "none",
          transition:"all 0.4s",
        }}>P{player}</span>
        {active && (
          <span style={{
            marginLeft:"auto", color:brt,
            fontFamily:"monospace",fontSize:8,letterSpacing:2,
            textShadow:`0 0 10px ${col}`,
          }}>TURN</span>
        )}
      </div>

      {/* score */}
      <div>
        <div style={{color:C.dim,fontFamily:"monospace",fontSize:8,letterSpacing:3,marginBottom:5}}>SCORE</div>
        <div style={{
          color:C.white,
          fontFamily:"'Courier New',monospace",
          fontSize:24,fontWeight:900,letterSpacing:-1,
          textShadow: active ? `0 0 18px ${col}99, 0 0 32px ${col}44` : `0 0 6px ${col}33`,
          transition:"text-shadow 0.4s",
        }}>{score.toLocaleString()}</div>
      </div>

      {/* speed */}
      <div>
        <div style={{color:C.dim,fontFamily:"monospace",fontSize:8,letterSpacing:3,marginBottom:8}}>SPEED</div>
        <SpeedBar band={band} col={col}/>
        <div style={{
          color:col,fontFamily:"monospace",fontSize:10,marginTop:5,
          textShadow:`0 0 10px ${col}88`,
        }}>S{band} · {speed}ms/cell</div>
      </div>

      {/* next */}
      <div>
        <div style={{color:C.dim,fontFamily:"monospace",fontSize:8,letterSpacing:3,marginBottom:8}}>NEXT</div>
        <MiniPiece piece={piece} col={col} brt={brt}/>
      </div>
    </div>
  );
}

function Divider({ active }) {
  const col = active===1 ? C.p1 : C.p2;
  return (
    <div style={{
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      gap:5,padding:"0 10px",height:ROWS*CELL,
    }}>
      <div style={{width:1,flex:1,background:`linear-gradient(to bottom, transparent, ${col}44)`}}/>
      <div style={{
        width:26,height:26,borderRadius:"50%",
        background:`radial-gradient(circle, ${col}33 0%, transparent 70%)`,
        border:`1.5px solid ${col}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:11,color:col,
        boxShadow:`0 0 16px ${col}cc, 0 0 30px ${col}66, 0 0 50px ${col}22`,
      }}>{active===1?"◀":"▶"}</div>
      <div style={{width:1,flex:1,background:`linear-gradient(to bottom, ${col}44, transparent)`}}/>
    </div>
  );
}

/* ── GAME SCREEN ── */
function GameScreen() {
  const board = makeSampleBoard();
  return (
    <div style={{display:"flex",alignItems:"center",padding:24,background:C.bg,gap:0}}>
      <Panel player={1} score={1240} speed={520} band={2}
        piece={[[0,0],[1,0],[2,0],[1,1]]} active={true}/>
      <Divider active={1}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <div style={{fontFamily:"monospace",fontSize:9,letterSpacing:5,color:C.dim}}>CHESS-TET</div>
        <Board board={board}/>
        <div style={{display:"flex",justifyContent:"space-around",width:"100%",marginTop:2}}>
          <span style={{fontFamily:"monospace",fontSize:10,color:C.p1,textShadow:`0 0 10px ${C.p1}`}}>■ PLAYER 1</span>
          <span style={{fontFamily:"monospace",fontSize:10,color:C.p2,textShadow:`0 0 10px ${C.p2}`}}>■ PLAYER 2</span>
        </div>
      </div>
      <Divider active={1}/>
      <Panel player={2} score={890} speed={650} band={1}
        piece={[[0,0],[1,0],[2,0],[3,0]]} active={false}/>
    </div>
  );
}

/* ── START SCREEN ── */
function StartScreen() {
  const W = COLS*CELL+400, H = ROWS*CELL+80;
  return (
    <div style={{
      width:W,height:H,
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      background:C.bg,gap:28,
      position:"relative",overflow:"hidden",
    }}>
      <div style={{
        position:"absolute",inset:0,opacity:0.04,
        backgroundImage:`linear-gradient(${C.p1} 1px,transparent 1px),linear-gradient(90deg,${C.p2} 1px,transparent 1px)`,
        backgroundSize:`${CELL}px ${CELL}px`,
      }}/>
      {[["24%","18%",C.p1,260],["68%","62%",C.p2,220]].map(([t,l,col,s],i)=>(
        <div key={i} style={{
          position:"absolute",top:t,left:l,
          width:s,height:s,borderRadius:"50%",
          background:`radial-gradient(circle,${col}22 0%,transparent 70%)`,
          filter:"blur(36px)",
        }}/>
      ))}

      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontFamily:"monospace",fontSize:9,letterSpacing:7,color:C.dim,marginBottom:10}}>
          TWO PLAYERS · ONE BOARD
        </div>
        <div style={{
          fontFamily:"'Courier New',monospace",
          fontSize:58,fontWeight:900,letterSpacing:-2,
          background:`linear-gradient(130deg,${C.p1} 0%,${C.p1b} 40%,${C.p2b} 70%,${C.p2} 100%)`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          filter:`drop-shadow(0 0 28px ${C.p1}66) drop-shadow(0 0 56px ${C.p2}33)`,
          lineHeight:1,
        }}>CHESS-TET</div>
      </div>

      <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <button style={{
          padding:"14px 56px",
          background:`linear-gradient(135deg,${C.p1},${C.p2})`,
          border:"none",borderRadius:4,
          fontFamily:"monospace",fontSize:13,fontWeight:900,
          letterSpacing:4,color:"#050508",cursor:"pointer",
          boxShadow:`0 0 30px ${C.p1}88,0 0 60px ${C.p1}33,0 0 90px ${C.p2}22`,
        }}>START MATCH</button>
        <div style={{color:C.dim,fontFamily:"monospace",fontSize:8,letterSpacing:3}}>
          ARROWS · SPACE · Z/X
        </div>
      </div>

      <div style={{zIndex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 18px"}}>
        {[["← →","Move"],["↑ / Z","Rotate"],["↓","Soft Drop"],["SPACE","Hard Drop"]].map(([k,a])=>(
          <div key={k} style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{
              fontFamily:"monospace",fontSize:10,color:C.p1,
              background:"#080812",border:`1px solid ${C.p1}55`,
              padding:"2px 8px",borderRadius:3,minWidth:58,textAlign:"center",
              boxShadow:`0 0 8px ${C.p1}33,inset 0 0 6px ${C.p1}11`,
            }}>{k}</span>
            <span style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── END SCREEN ── */
function EndScreen() {
  const W = COLS*CELL+400, H = ROWS*CELL+80;
  return (
    <div style={{
      width:W,height:H,
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      background:C.bg,gap:22,
      position:"relative",overflow:"hidden",
    }}>
      <div style={{
        position:"absolute",top:"20%",left:"20%",
        width:380,height:380,borderRadius:"50%",
        background:`radial-gradient(circle,${C.p1}14 0%,transparent 65%)`,
        filter:"blur(40px)",
      }}/>

      <div style={{fontFamily:"monospace",fontSize:9,letterSpacing:7,color:C.dim,zIndex:1}}>
        MATCH OVER
      </div>
      <div style={{
        fontFamily:"'Courier New',monospace",fontSize:32,fontWeight:900,
        letterSpacing:3,color:C.p1,zIndex:1,
        textShadow:`0 0 20px ${C.p1},0 0 40px ${C.p1}88,0 0 70px ${C.p1}33`,
      }}>PLAYER 1 WINS</div>

      <div style={{display:"flex",gap:24,zIndex:1}}>
        {[
          {n:1,score:1240,col:C.p1,brt:C.p1b,penalty:false,win:true},
          {n:2,score:490, col:C.p2,brt:C.p2b,penalty:true, win:false},
        ].map(({n,score,col,brt,penalty,win})=>(
          <div key={n} style={{
            background: win
              ? `linear-gradient(150deg,${col}18 0%,${C.panel} 55%)`
              : C.panel,
            border:`1.5px solid ${win ? col : "#1a1a2c"}`,
            borderRadius:8,padding:22,minWidth:150,
            display:"flex",flexDirection:"column",gap:10,alignItems:"center",
            boxShadow: win
              ? `0 0 30px ${col}55,0 0 60px ${col}22,inset 0 0 24px ${col}0c`
              : "none",
          }}>
            <div style={{
              fontFamily:"monospace",fontSize:10,letterSpacing:3,color:col,
              textShadow: win ? `0 0 12px ${col}` : "none",
            }}>PLAYER {n}</div>
            <div style={{
              fontFamily:"'Courier New',monospace",fontSize:30,fontWeight:900,
              color:C.white,
              textShadow: win ? `0 0 16px ${col}88` : "none",
            }}>{score.toLocaleString()}</div>
            {penalty && (
              <div style={{fontFamily:"monospace",fontSize:10,color:C.p2,
                textShadow:`0 0 8px ${C.p2}`}}>TOP-OUT −400</div>
            )}
            {win && (
              <div style={{fontFamily:"monospace",fontSize:8,letterSpacing:3,
                color:brt,textShadow:`0 0 10px ${col}`}}>★ WINNER</div>
            )}
          </div>
        ))}
      </div>

      <button style={{
        marginTop:8,zIndex:1,
        padding:"12px 44px",
        background:"transparent",
        border:`1.5px solid ${C.p1}`,
        borderRadius:4,
        fontFamily:"monospace",fontSize:11,fontWeight:700,
        letterSpacing:4,color:C.p1,cursor:"pointer",
        boxShadow:`0 0 16px ${C.p1}55,0 0 32px ${C.p1}22`,
      }}>PLAY AGAIN</button>
    </div>
  );
}

/* ── ROOT ── */
const TABS = [["game","▶ Game"],["start","◎ Start"],["end","✓ End"]];

export default function App() {
  const [screen,setScreen] = useState("game");
  return (
    <div style={{
      background:"#030306",minHeight:"100vh",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"flex-start",
      padding:24,
    }}>
      <div style={{
        display:"flex",gap:3,marginBottom:24,
        background:C.panel,padding:4,borderRadius:6,
        border:`1px solid ${C.border}`,
      }}>
        {TABS.map(([s,label])=>(
          <button key={s} onClick={()=>setScreen(s)} style={{
            padding:"8px 22px",
            background: screen===s
              ? `linear-gradient(135deg,${C.p1}dd,${C.p2}cc)`
              : "transparent",
            color: screen===s ? "#050508" : C.dim,
            border:"none",borderRadius:4,
            fontFamily:"monospace",fontSize:10,
            fontWeight: screen===s ? 900 : 400,
            letterSpacing:2,cursor:"pointer",
            boxShadow: screen===s ? `0 0 16px ${C.p1}55` : "none",
          }}>{label}</button>
        ))}
      </div>

      <div style={{
        border:`1.5px solid #1c1c2e`,borderRadius:10,overflow:"hidden",
        boxShadow:`
          0 0  80px rgba(255,122,0,0.1),
          0 0 160px rgba(0,229,255,0.06),
          0  40px 100px rgba(0,0,0,0.95)
        `,
      }}>
        {screen==="game"  && <GameScreen/>}
        {screen==="start" && <StartScreen/>}
        {screen==="end"   && <EndScreen/>}
      </div>

      <div style={{marginTop:16,color:C.dim,fontFamily:"monospace",fontSize:8,letterSpacing:3}}>
        CHESS-TET · COMPONENT REFERENCE · v1
      </div>
    </div>
  );
}

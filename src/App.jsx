import { useState, useEffect } from "react";

// ─── Colores ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#0e1214", card:"#181d20", card2:"#1e2428",
  border:"#283035", borderHi:"#38484f",
  accent:"#00d4e8", accentDark:"#009ab0", accentGlow:"#00d4e818",
  text:"#eef3f4", muted:"#607880",
  danger:"#ff4466", warn:"#f5a623", ok:"#22c55e", dep:"#a855f7",
};

const ADMIN_USER = "fbox";
const ADMIN_PASS = "admin123";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hoy     = () => new Date();
const fmt     = (d) => d.toISOString().split("T")[0];
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const DIAS_C  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DIAS_L  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function getLunes(d) {
  const x=new Date(d), diff=x.getDay()===0?-6:1-x.getDay();
  x.setDate(x.getDate()+diff); return x;
}
function pasó(dia,hora)    { return new Date(`${dia}T${hora}`)<hoy(); }
function menosDeUnaHora(dia,hora) {
  if(dia!==fmt(hoy())) return false;
  const t=new Date(); const [h,m]=hora.split(":").map(Number);
  t.setHours(h,m,0,0); return (t-hoy())<3600000;
}

// ─── Planes por defecto ───────────────────────────────────────────────────────
const PLANES_DEFAULT = [
  { id:"p8",    clases:8,  precio:30000, label:"8 clases/mes",  tipo:"LIBRE",      desc:"Funcional, Musculación y Cross" },
  { id:"p12",   clases:12, precio:32000, label:"12 clases/mes", tipo:"LIBRE",      desc:"Funcional, Musculación y Cross" },
  { id:"p16",   clases:16, precio:34000, label:"16 clases/mes", tipo:"LIBRE",      desc:"Funcional, Musculación y Cross" },
  { id:"p20",   clases:20, precio:35000, label:"20 clases/mes", tipo:"LIBRE",      desc:"Funcional, Musculación y Cross" },
  { id:"dep12", clases:12, precio:40000, label:"12 clases/mes", tipo:"ESPECÍFICO", desc:"Entrenamiento específico para deportes" },
];
const INSCRIPCION_DEFAULT = 7000;

const TIPOS = [
  { nombre:"Musculación",          color:"#f97316", emoji:"🏋️" },
  { nombre:"Funcional",            color:"#00d4e8", emoji:"⚡" },
  { nombre:"Cross Training",       color:"#ef4444", emoji:"🔥" },
  { nombre:"Específico Deportivo", color:"#a855f7", emoji:"🎯" },
];
const getTipo = (n) => TIPOS.find(t=>t.nombre===n)||TIPOS[0];

const HORARIO_OFICIAL = [
  {hora:"08:00",dia:1,nombre:"Específico Deportivo"},{hora:"08:00",dia:3,nombre:"Específico Deportivo"},{hora:"08:00",dia:5,nombre:"Específico Deportivo"},
  {hora:"17:00",dia:1,nombre:"Funcional"},{hora:"17:00",dia:3,nombre:"Funcional"},{hora:"17:00",dia:5,nombre:"Funcional"},
  {hora:"18:00",dia:1,nombre:"Específico Deportivo"},{hora:"18:00",dia:3,nombre:"Específico Deportivo"},{hora:"18:00",dia:5,nombre:"Específico Deportivo"},
  {hora:"19:00",dia:1,nombre:"Específico Deportivo"},{hora:"19:00",dia:2,nombre:"Musculación"},{hora:"19:00",dia:3,nombre:"Específico Deportivo"},{hora:"19:00",dia:4,nombre:"Musculación"},{hora:"19:00",dia:5,nombre:"Específico Deportivo"},
  {hora:"20:00",dia:1,nombre:"Funcional"},{hora:"20:00",dia:2,nombre:"Musculación"},{hora:"20:00",dia:3,nombre:"Funcional"},{hora:"20:00",dia:4,nombre:"Musculación"},{hora:"20:00",dia:5,nombre:"Funcional"},
  {hora:"21:00",dia:1,nombre:"Funcional"},{hora:"21:00",dia:2,nombre:"Cross Training"},{hora:"21:00",dia:3,nombre:"Funcional"},{hora:"21:00",dia:4,nombre:"Cross Training"},{hora:"21:00",dia:5,nombre:"Funcional"},
];

function generarSemana(lunes) {
  return HORARIO_OFICIAL.map((h,i)=>{
    const d=addDays(lunes,h.dia-1);
    return { id:`s${fmt(lunes)}${i}`, nombre:h.nombre, instructor:"", dia:fmt(d), hora:h.hora, capacidad:10, color:getTipo(h.nombre).color };
  });
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const KEY = "fbox_gym_v7";
function saveLocal(d) { try { localStorage.setItem(KEY,JSON.stringify(d)); } catch {} }
function loadLocal()  { try { const s=localStorage.getItem(KEY); if(s){const d=JSON.parse(s);if(d?.socios)return d;} } catch {} return null; }
async function saveAll(d) { try { await window.storage.set(KEY,JSON.stringify(d)); } catch {} saveLocal(d); }
async function loadAll() {
  try { const r=await window.storage.get(KEY); if(r?.value){const d=JSON.parse(r.value);if(d?.socios)return d;} } catch {}
  return loadLocal();
}

const DATOS_INIT = () => ({
  socios:[], clases:generarSemana(getLunes(hoy())), bookings:[],
  planes: PLANES_DEFAULT, inscripcion: INSCRIPCION_DEFAULT,
});

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:${C.card}}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  input,select{background:${C.card2};border:1px solid ${C.border};color:${C.text};border-radius:8px;padding:9px 13px;font-family:inherit;font-size:14px;outline:none;width:100%;transition:border .15s,box-shadow .15s}
  input:focus,select:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.accentGlow}}
  input::placeholder{color:${C.muted}}
  button{cursor:pointer;font-family:inherit}
  option{background:${C.card2}}
`;

// ─── UI base ──────────────────────────────────────────────────────────────────
const Logo = ({size=42}) => (
  <div style={{fontFamily:"'Barlow Condensed'",fontSize:size,fontWeight:900,letterSpacing:3,background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>F-BOX</div>
);
const Tag = ({color,children,sm}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:sm?"1px 8px":"2px 10px",borderRadius:99,fontSize:sm?10:12,fontWeight:700,background:color+"22",color,border:`1px solid ${color}40`,whiteSpace:"nowrap"}}>{children}</span>
);
const Btn = ({onClick,v="primary",children,sm,disabled,full}) => {
  const S={
    primary:{background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,color:"#091214",border:"none",boxShadow:`0 2px 16px ${C.accentGlow}`},
    danger:{background:"transparent",color:C.danger,border:`1px solid ${C.danger}50`},
    ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`},
    ok:{background:`${C.ok}20`,color:C.ok,border:`1px solid ${C.ok}50`},
    warn:{background:`${C.warn}20`,color:C.warn,border:`1px solid ${C.warn}50`},
  };
  return <button disabled={disabled} onClick={onClick} style={{...S[v],borderRadius:8,padding:sm?"5px 13px":"9px 20px",fontWeight:700,fontSize:13,opacity:disabled?.35:1,transition:"opacity .15s",width:full?"100%":undefined,letterSpacing:.3}}>{children}</button>;
};
const Modal = ({titulo,onCerrar,children}) => (
  <div onClick={e=>e.target===e.currentTarget&&onCerrar()} style={{position:"fixed",inset:0,background:"#000d",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:16,width:"100%",maxWidth:460,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px #0009"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 22px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontFamily:"'Barlow Condensed'",fontSize:20,fontWeight:800,letterSpacing:1,color:C.accent}}>{titulo}</span>
        <button onClick={onCerrar} style={{background:"none",border:"none",color:C.muted,fontSize:26,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div>
);
const Campo = ({label,children}) => (
  <div>
    <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:5,fontWeight:700,letterSpacing:.8}}>{label}</label>
    {children}
  </div>
);
function useToast() {
  const [msg,setMsg]=useState("");
  const show=(m)=>{setMsg(m);setTimeout(()=>setMsg(""),3200);};
  return [msg,show];
}
const Toast = ({msg}) => msg?(
  <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"11px 20px",fontSize:13,color:C.text,zIndex:999,boxShadow:"0 8px 24px #000a",whiteSpace:"nowrap",maxWidth:"92vw"}}>{msg}</div>
):null;

// ─── Pantalla Login ───────────────────────────────────────────────────────────
function Login({socios,onAdmin,onSocio}) {
  const [modo,setModo]=useState("inicio");
  const [u,setU]=useState(""); const [p,setP]=useState("");
  const [n,setN]=useState(""); const [d,setD]=useState("");
  const [err,setErr]=useState("");

  const tryAdmin=()=>{
    if(u===ADMIN_USER&&p===ADMIN_PASS) onAdmin();
    else setErr("Usuario o contraseña incorrectos.");
  };
  const trySocio=()=>{
    const norm=n.trim().toLowerCase();
    const s=socios.find(x=>x.nombre.toLowerCase()===norm&&x.dni===d.trim()&&x.activo);
    if(s) onSocio(s);
    else if(socios.some(x=>x.dni===d.trim()&&!x.activo)) setErr("Tu cuenta está suspendida. Contactá al gimnasio.");
    else setErr("Nombre o DNI incorrecto.");
  };
  const hk=fn=>e=>e.key==="Enter"&&fn();

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{marginBottom:32,textAlign:"center"}}><Logo size={54}/><div style={{color:C.muted,fontSize:12,letterSpacing:2,marginTop:6,fontWeight:600}}>GESTIÓN DE CLASES</div></div>
      {modo==="inicio"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:320}}>
          <button onClick={()=>setModo("socio")} style={{background:C.card,border:`1.5px solid ${C.accent}`,borderRadius:14,padding:"20px 24px",color:C.text,textAlign:"left",cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:6}}>👤</div>
            <div style={{fontFamily:"'Barlow Condensed'",fontSize:24,fontWeight:800,color:C.accent}}>Soy socio</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Ver clases, anotarme y ver planes</div>
          </button>
          <button onClick={()=>setModo("admin")} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"20px 24px",color:C.text,textAlign:"left",cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:6}}>🔐</div>
            <div style={{fontFamily:"'Barlow Condensed'",fontSize:24,fontWeight:800}}>Admin</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Panel de administración</div>
          </button>
        </div>
      )}
      {modo==="admin"&&(
        <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:14}}>
          <Campo label="USUARIO"><input value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={hk(tryAdmin)} placeholder="Usuario" autoFocus/></Campo>
          <Campo label="CONTRASEÑA"><input type="password" value={p} onChange={e=>{setP(e.target.value);setErr("");}} onKeyDown={hk(tryAdmin)} placeholder="••••••••"/></Campo>
          {err&&<div style={{background:`${C.danger}18`,border:`1px solid ${C.danger}40`,borderRadius:8,padding:"9px 13px",fontSize:13,color:C.danger}}>{err}</div>}
          <Btn onClick={tryAdmin} disabled={!u||!p} full>Entrar como Admin</Btn>
          <button onClick={()=>{setModo("inicio");setErr("");setU("");setP("");}} style={{background:"none",border:"none",color:C.muted,fontSize:13,textDecoration:"underline",cursor:"pointer"}}>← Volver</button>
        </div>
      )}
      {modo==="socio"&&(
        <div style={{width:"100%",maxWidth:340,display:"flex",flexDirection:"column",gap:14}}>
          <Campo label="TU NOMBRE COMPLETO"><input value={n} onChange={e=>{setN(e.target.value);setErr("");}} onKeyDown={hk(trySocio)} placeholder="Ej: Laura Gómez" autoFocus/></Campo>
          <Campo label="TU DNI (sin puntos)"><input value={d} onChange={e=>{setD(e.target.value.replace(/\D/g,""));setErr("");}} onKeyDown={hk(trySocio)} placeholder="Ej: 12345678" maxLength={9}/></Campo>
          {err&&<div style={{background:`${C.danger}18`,border:`1px solid ${C.danger}40`,borderRadius:8,padding:"9px 13px",fontSize:13,color:C.danger}}>{err}</div>}
          <Btn onClick={trySocio} disabled={!n.trim()||!d} full>Ingresar</Btn>
          <button onClick={()=>{setModo("inicio");setErr("");setN("");setD("");}} style={{background:"none",border:"none",color:C.muted,fontSize:13,textDecoration:"underline",cursor:"pointer"}}>← Volver</button>
        </div>
      )}
    </div>
  );
}

// ─── Vista Planes (socios) ────────────────────────────────────────────────────
function VistaPlanes({planes,inscripcion}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:`${C.accent}10`,border:`1px solid ${C.accent}30`,borderRadius:10,padding:"10px 16px",fontSize:13,color:C.accent}}>
        💡 Inscripción única: <strong>${inscripcion.toLocaleString("es-AR")}</strong>
      </div>
      {planes.map(p=>{
        const esEsp=p.tipo==="ESPECÍFICO";
        return (
          <div key={p.id} style={{background:C.card,border:`1px solid ${esEsp?C.dep+"50":C.border}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28}}>{esEsp?"🎯":"⚡"}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontFamily:"'Barlow Condensed'",fontSize:22,fontWeight:800,color:C.text}}>{p.label}</span>
                <Tag color={esEsp?C.dep:C.accentDark} sm>{p.tipo==="ESPECÍFICO"?"ESPECÍFICO":"LIBRE"}</Tag>
              </div>
              <div style={{fontSize:12,color:C.muted}}>{p.desc}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'Barlow Condensed'",fontSize:26,fontWeight:900,color:esEsp?C.dep:C.accent}}>${p.precio.toLocaleString("es-AR")}</div>
              <div style={{fontSize:11,color:C.muted}}>por mes</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Portal Socio ─────────────────────────────────────────────────────────────
function PortalSocio({socioId,datos,guardar,onSalir}) {
  const [diaActivo,setDiaActivo]=useState(fmt(hoy()));
  const [tab,setTab]=useState("clases");
  const [toast,showToast]=useToast();

  const {socios,clases,bookings,planes,inscripcion}=datos;
  const socio=socios.find(s=>s.id===socioId)||{};
  const plan=planes.find(p=>p.id===socio.planId)||planes[0];
  const pct=Math.max(0,Math.min(100,Math.round((socio.clasesRestantes/plan.clases)*100)));
  const barC=socio.clasesRestantes===0?C.danger:pct<=25?C.warn:C.ok;

  const estaAnotado=cId=>bookings.some(b=>b.claseId===cId&&b.socioId===socioId);
  const inscEn=cId=>bookings.filter(b=>b.claseId===cId).length;

  const anotarse=async(clase)=>{
    if(socio.clasesRestantes<=0){showToast("❌ No tenés clases disponibles. Hablá con el gimnasio.");return;}
    if(estaAnotado(clase.id)){showToast("Ya estás anotado en esta clase.");return;}
    if(inscEn(clase.id)>=clase.capacidad){showToast("La clase está llena.");return;}
    await guardar({...datos,bookings:[...bookings,{id:Date.now(),socioId,claseId:clase.id}],socios:socios.map(s=>s.id===socioId?{...s,clasesRestantes:s.clasesRestantes-1}:s)});
    showToast("✅ ¡Inscripción confirmada! Se descontó 1 clase.");
  };

  const bajarse=async(clase)=>{
    if(menosDeUnaHora(clase.dia,clase.hora)){showToast("⏰ No podés bajarte con menos de 1 hora de anticipación. Se descuenta la clase.");return;}
    await guardar({...datos,bookings:bookings.filter(b=>!(b.claseId===clase.id&&b.socioId===socioId)),socios:socios.map(s=>s.id===socioId?{...s,clasesRestantes:s.clasesRestantes+1}:s)});
    showToast("↩ Te diste de baja. La clase volvió a tu saldo.");
  };

  const semana=Array.from({length:7},(_,i)=>addDays(getLunes(hoy()),i));
  const clasesDia=clases.filter(c=>c.dia===diaActivo).sort((a,b)=>a.hora.localeCompare(b.hora));
  const misClases=bookings.filter(b=>b.socioId===socioId).map(b=>clases.find(c=>c.id===b.claseId)).filter(Boolean).sort((a,b)=>a.dia===b.dia?a.hora.localeCompare(b.hora):a.dia.localeCompare(b.dia));

  const TABS=[["clases","📅 Clases"],["misclases","📋 Mis clases"],["planes","💰 Planes"]];

  return (
    <div style={{maxWidth:600,margin:"0 auto",paddingBottom:50}}>
      <Toast msg={toast}/>
      <div style={{padding:"18px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <Logo size={28}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:15}}>Hola, {(socio.nombre||"").split(" ")[0]} 👋</div>
            <div style={{color:C.muted,fontSize:12}}>{plan.label} · {plan.tipo==="ESPECÍFICO"?"Específico":"Libre"}</div>
          </div>
          <button onClick={onSalir} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:12,padding:"6px 12px",cursor:"pointer",fontWeight:600}}>Salir</button>
        </div>

        {/* Saldo */}
        <div style={{background:C.card,border:`1px solid ${socio.clasesRestantes===0?C.danger+"60":C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600}}>Clases disponibles</span>
            <span style={{fontFamily:"'Barlow Condensed'",fontSize:28,fontWeight:800,color:barC}}>{socio.clasesRestantes}<span style={{fontSize:14,color:C.muted,fontFamily:"Inter"}}>/{plan.clases}</span></span>
          </div>
          <div style={{height:6,background:C.border,borderRadius:99,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:barC,borderRadius:99,transition:"width .4s"}}/>
          </div>
          {socio.clasesRestantes===0&&<div style={{fontSize:12,color:C.danger,marginTop:8,fontWeight:600}}>🚫 Sin clases. Hablá con el gimnasio para renovar.</div>}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {TABS.map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:tab===id?`linear-gradient(135deg,${C.accent},${C.accentDark})`:"transparent",color:tab===id?"#091214":C.muted,border:`1px solid ${tab===id?C.accent:C.border}`,borderRadius:8,padding:"8px 4px",fontWeight:700,fontSize:11}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 16px"}}>

        {/* Tab: Clases */}
        {tab==="clases"&&(
          <div>
            <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
              {semana.map(d=>{
                const dow=d.getDay(); if(dow===0||dow===6) return null;
                const ds=fmt(d); const sel=ds===diaActivo;
                const cnt=clases.filter(c=>c.dia===ds).length;
                return (
                  <button key={ds} onClick={()=>setDiaActivo(ds)} style={{background:sel?`linear-gradient(135deg,${C.accent},${C.accentDark})`:C.card,color:sel?"#091214":C.muted,border:`1px solid ${sel?C.accent:C.border}`,borderRadius:10,padding:"8px 10px",minWidth:58,display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:700}}>{DIAS_C[dow]}</span>
                    <span style={{fontSize:21,fontFamily:"'Barlow Condensed'",fontWeight:800,lineHeight:1.1}}>{d.getDate()}</span>
                    {cnt>0&&<span style={{fontSize:10,background:sel?"#09121430":C.accentGlow,color:sel?"#091214":C.accent,borderRadius:99,padding:"0 5px",fontWeight:700}}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {clasesDia.length===0&&<div style={{color:C.muted,textAlign:"center",padding:48}}>Sin clases este día.</div>}
              {clasesDia.map(cls=>{
                const tp=getTipo(cls.nombre);
                const cnt=inscEn(cls.id); const llena=cnt>=cls.capacidad;
                const anotado=estaAnotado(cls.id);
                const proxima=menosDeUnaHora(cls.dia,cls.hora);
                const ya=pasó(cls.dia,cls.hora);
                return (
                  <div key={cls.id} style={{background:C.card,border:`1.5px solid ${anotado?C.accent+"60":C.border}`,borderRadius:14,padding:"13px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:3,height:44,borderRadius:4,background:cls.color,flexShrink:0}}/>
                      <span style={{fontSize:18}}>{tp.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:2}}>
                          <span style={{fontFamily:"'Barlow Condensed'",fontSize:20,fontWeight:800}}>{cls.nombre}</span>
                          {anotado&&<Tag color={C.accent} sm>ANOTADO ✓</Tag>}
                          {llena&&!anotado&&<Tag color={C.danger} sm>LLENO</Tag>}
                        </div>
                        <div style={{color:C.muted,fontSize:12}}>🕐 {cls.hora}{cls.instructor?` · 👤 ${cls.instructor}`:""} · {cnt}/{cls.capacidad}</div>
                      </div>
                      <div style={{flexShrink:0}}>
                        {ya?<span style={{fontSize:12,color:C.muted}}>Finalizada</span>
                          :anotado?<Btn sm v={proxima?"warn":"danger"} onClick={()=>bajarse(cls)}>{proxima?"⚠️ Pierde clase":"Dar de baja"}</Btn>
                          :<Btn sm onClick={()=>anotarse(cls)} disabled={llena||socio.clasesRestantes===0}>{llena?"Llena":socio.clasesRestantes===0?"Sin clases":"Anotarme"}</Btn>}
                      </div>
                    </div>
                    {anotado&&proxima&&(
                      <div style={{marginTop:8,background:`${C.warn}15`,border:`1px solid ${C.warn}40`,borderRadius:8,padding:"7px 12px",fontSize:12,color:C.warn}}>
                        ⚠️ Falta menos de 1 hora. Si te bajás ahora <strong>se descuenta la clase</strong>.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Mis clases */}
        {tab==="misclases"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {misClases.length===0&&<div style={{color:C.muted,textAlign:"center",padding:48}}><div style={{fontSize:32,marginBottom:8}}>📭</div>No estás anotado a ninguna clase.</div>}
            {misClases.map(cls=>{
              const tp=getTipo(cls.nombre);
              const proxima=menosDeUnaHora(cls.dia,cls.hora);
              const ya=pasó(cls.dia,cls.hora);
              const diaLabel=DIAS_L[new Date(cls.dia+"T12:00:00").getDay()];
              return (
                <div key={cls.id} style={{background:C.card,border:`1px solid ${ya?C.border:C.accent+"40"}`,borderRadius:14,padding:"13px 16px",opacity:ya?.65:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:3,height:44,borderRadius:4,background:cls.color,flexShrink:0}}/>
                    <span style={{fontSize:18}}>{tp.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Barlow Condensed'",fontSize:20,fontWeight:800,marginBottom:2}}>{cls.nombre}</div>
                      <div style={{color:C.muted,fontSize:12}}>📅 {diaLabel} {cls.dia.slice(5)} · 🕐 {cls.hora}{cls.instructor?` · 👤 ${cls.instructor}`:""}</div>
                    </div>
                    {!ya&&<Btn sm v={proxima?"warn":"danger"} onClick={()=>bajarse(cls)}>{proxima?"⚠️ Pierde clase":"Dar de baja"}</Btn>}
                    {ya&&<Tag color={C.muted} sm>Pasada</Tag>}
                  </div>
                  {!ya&&proxima&&(
                    <div style={{marginTop:8,background:`${C.warn}15`,border:`1px solid ${C.warn}40`,borderRadius:8,padding:"7px 12px",fontSize:12,color:C.warn}}>
                      ⚠️ Menos de 1 hora. Si te bajás <strong>perdés la clase</strong>.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Planes */}
        {tab==="planes"&&<VistaPlanes planes={planes} inscripcion={inscripcion}/>}
      </div>
    </div>
  );
}

// ─── Panel Admin ──────────────────────────────────────────────────────────────
function PanelAdmin({datos,guardar,onSalir}) {
  const [tab,setTab]=useState("clases");
  const {socios}=datos;
  const sinClases=socios.filter(s=>s.activo&&s.clasesRestantes===0).length;

  return (
    <div style={{maxWidth:880,margin:"0 auto",paddingBottom:50}}>
      <div style={{padding:"18px 18px 0",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div><Logo size={34}/><div style={{color:C.muted,fontSize:10,letterSpacing:2,fontWeight:700,marginTop:1}}>ADMINISTRACIÓN</div></div>
          <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {[{id:"clases",l:"📅 Clases"},{id:"socios",l:"👥 Socios"},{id:"precios",l:"💰 Precios"},{id:"horarios",l:"🗓 Horarios"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?`linear-gradient(135deg,${C.accent},${C.accentDark})`:"transparent",color:tab===t.id?"#091214":C.muted,border:`1px solid ${tab===t.id?C.accent:C.border}`,borderRadius:8,padding:"7px 13px",fontWeight:700,fontSize:13}}>{t.l}</button>
            ))}
            <button onClick={onSalir} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.muted,fontSize:12,padding:"7px 12px",cursor:"pointer",fontWeight:600}}>Salir</button>
          </div>
        </div>
      </div>

      {sinClases>0&&tab!=="horarios"&&tab!=="precios"&&(
        <div style={{margin:"0 18px 12px",background:`${C.danger}12`,border:`1px solid ${C.danger}40`,borderRadius:10,padding:"10px 16px",fontSize:13,color:C.danger,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          🚫 <strong>{sinClases} socio{sinClases>1?"s":""}</strong> sin clases — deben renovar.
          {tab!=="socios"&&<button onClick={()=>setTab("socios")} style={{background:"none",border:"none",color:C.danger,textDecoration:"underline",cursor:"pointer",fontSize:13}}>Ver →</button>}
        </div>
      )}

      <div style={{padding:"0 18px"}}>
        {tab==="clases"   && <AdminClases   datos={datos} guardar={guardar}/>}
        {tab==="socios"   && <AdminSocios   datos={datos} guardar={guardar}/>}
        {tab==="precios"  && <AdminPrecios  datos={datos} guardar={guardar}/>}
        {tab==="horarios" && <AdminHorarios/>}
      </div>
    </div>
  );
}

// ─── Admin: Precios ───────────────────────────────────────────────────────────
function AdminPrecios({datos,guardar}) {
  const {planes,inscripcion}=datos;
  const [editPlanes,setEditPlanes]=useState(planes.map(p=>({...p})));
  const [editInsc,setEditInsc]=useState(inscripcion);
  const [guardado,setGuardado]=useState(false);
  const [toast,showToast]=useToast();

  const upd=(id,campo,val)=>setEditPlanes(prev=>prev.map(p=>p.id===id?{...p,[campo]:val}:p));

  const guardarPrecios=async()=>{
    const parsed=editPlanes.map(p=>({...p,precio:Number(String(p.precio).replace(/\D/g,""))||0,clases:Number(p.clases)||1}));
    await guardar({...datos,planes:parsed,inscripcion:Number(String(editInsc).replace(/\D/g,""))||0});
    setGuardado(true); setTimeout(()=>setGuardado(false),2500);
    showToast("✅ Precios actualizados correctamente");
  };

  return (
    <div>
      <Toast msg={toast}/>
      <div style={{marginBottom:16,background:`${C.accent}10`,border:`1px solid ${C.accent}30`,borderRadius:10,padding:"12px 16px",fontSize:13,color:C.accent}}>
        💡 Los cambios que hagas acá los ven los socios en la sección "Planes" de su portal.
      </div>

      {/* Inscripción */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:16}}>
        <div style={{fontFamily:"'Barlow Condensed'",fontSize:18,fontWeight:800,marginBottom:12,color:C.accent}}>INSCRIPCIÓN ÚNICA</div>
        <Campo label="PRECIO ($)">
          <input type="number" value={editInsc} onChange={e=>setEditInsc(e.target.value)} placeholder="7000"/>
        </Campo>
      </div>

      {/* Planes */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        {editPlanes.map(p=>{
          const esEsp=p.tipo==="ESPECÍFICO";
          return (
            <div key={p.id} style={{background:C.card,border:`1px solid ${esEsp?C.dep+"40":C.border}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:20}}>{esEsp?"🎯":"⚡"}</span>
                <div style={{fontFamily:"'Barlow Condensed'",fontSize:18,fontWeight:800,color:esEsp?C.dep:C.accent}}>{p.label}</div>
                <Tag color={esEsp?C.dep:C.accentDark} sm>{p.tipo}</Tag>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Campo label="CLASES POR MES">
                  <input type="number" min="1" max="30" value={p.clases} onChange={e=>upd(p.id,"clases",e.target.value)}/>
                </Campo>
                <Campo label="PRECIO MENSUAL ($)">
                  <input type="number" value={p.precio} onChange={e=>upd(p.id,"precio",e.target.value)}/>
                </Campo>
              </div>
              <div style={{marginTop:12}}>
                <Campo label="DESCRIPCIÓN">
                  <input value={p.desc} onChange={e=>upd(p.id,"desc",e.target.value)} placeholder="Ej: Funcional, Musculación y Cross"/>
                </Campo>
              </div>
            </div>
          );
        })}
      </div>

      <Btn onClick={guardarPrecios} full v={guardado?"ok":"primary"}>
        {guardado?"✅ Precios guardados":"💾 Guardar precios"}
      </Btn>
    </div>
  );
}

// ─── Admin: Socios ────────────────────────────────────────────────────────────
function AdminSocios({datos,guardar}) {
  const {socios,planes,inscripcion}=datos;
  const [modal,setModal]=useState(null);
  const [renovar,setRenovar]=useState(null);
  const [buscar,setBuscar]=useState("");
  const [form,setForm]=useState({nombre:"",dni:"",planId:"p8"});
  const [toast,showToast]=useToast();

  const filtrados=socios.filter(s=>s.nombre.toLowerCase().includes(buscar.toLowerCase())||(s.dni||"").includes(buscar));
  const getPlan=id=>planes.find(p=>p.id===id)||planes[0];

  const guardarSocio=async()=>{
    if(!form.nombre.trim()||!form.dni.trim()) return;
    const plan=getPlan(form.planId);
    let nuevos;
    if(modal==="nuevo"){
      if(socios.some(s=>s.dni===form.dni.trim())){alert("Ya existe un socio con ese DNI.");return;}
      nuevos=[...socios,{id:Date.now(),nombre:form.nombre.trim(),dni:form.dni.trim(),planId:form.planId,clasesRestantes:plan.clases,activo:true,desde:fmt(hoy())}];
    } else {
      nuevos=socios.map(s=>s.id===modal.id?{...s,nombre:form.nombre.trim(),dni:form.dni.trim(),planId:form.planId}:s);
    }
    await guardar({...datos,socios:nuevos}); setModal(null);
  };

  const doRenovar=async(socio,planId)=>{
    const plan=getPlan(planId);
    await guardar({...datos,socios:socios.map(s=>s.id===socio.id?{...s,planId,clasesRestantes:s.clasesRestantes+plan.clases,activo:true}:s)});
    setRenovar(null); showToast(`✅ Se sumaron ${plan.clases} clases a ${socio.nombre.split(" ")[0]}`);
  };

  const toggleActivo=async s=>{
    await guardar({...datos,socios:socios.map(x=>x.id===s.id?{...x,activo:!x.activo}:x)});
  };

  return (
    <div>
      <Toast msg={toast}/>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="🔍 Buscar por nombre o DNI..." value={buscar} onChange={e=>setBuscar(e.target.value)} style={{maxWidth:280}}/>
        <div style={{marginLeft:"auto"}}><Btn onClick={()=>{setForm({nombre:"",dni:"",planId:planes[0]?.id||"p8"});setModal("nuevo");}}>+ Nuevo socio</Btn></div>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[{icon:"👥",label:"Total",val:socios.length,c:undefined},{icon:"✅",label:"Activos",val:socios.filter(s=>s.activo).length,c:C.ok},{icon:"🚫",label:"Sin clases",val:socios.filter(s=>s.activo&&s.clasesRestantes===0).length,c:C.danger}].map(({icon,label,val,c})=>(
          <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",flex:1,minWidth:100}}>
            <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:.8}}>{icon} {label.toUpperCase()}</div>
            <div style={{fontFamily:"'Barlow Condensed'",fontSize:38,color:c||C.text,lineHeight:1.1,marginTop:2,fontWeight:800}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtrados.length===0&&<div style={{color:C.muted,textAlign:"center",padding:48}}>Sin socios registrados.</div>}
        {filtrados.map(s=>{
          const plan=getPlan(s.planId);
          const pct=Math.max(0,Math.min(100,Math.round((s.clasesRestantes/plan.clases)*100)));
          const barC=s.clasesRestantes===0?C.danger:pct<=25?C.warn:C.ok;
          const esEsp=plan.tipo==="ESPECÍFICO";
          const bloq=s.clasesRestantes===0&&s.activo;
          return (
            <div key={s.id} style={{background:C.card,border:`1.5px solid ${bloq?C.danger+"60":C.border}`,borderRadius:12,padding:"13px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${C.accent}15`,border:`1.5px solid ${C.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:C.accent,fontSize:14,flexShrink:0}}>
                  {s.nombre.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontWeight:600,fontSize:15}}>{s.nombre}</span>
                    <Tag color={s.activo?C.ok:C.muted} sm>{s.activo?"Activo":"Suspendido"}</Tag>
                    <Tag color={esEsp?C.dep:C.accentDark} sm>{plan.label}{esEsp?" · ESP":""}</Tag>
                    {bloq&&<Tag color={C.danger} sm>🚫 SIN CLASES</Tag>}
                  </div>
                  <div style={{color:C.muted,fontSize:12,marginBottom:5}}>🪪 {s.dni}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:4,background:C.border,borderRadius:99,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:barC,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                    <span style={{fontSize:12,color:barC,fontWeight:700,whiteSpace:"nowrap"}}>{s.clasesRestantes}/{plan.clases}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {bloq&&<Btn sm onClick={()=>setRenovar(s)}>💳 Renovar</Btn>}
                  <Btn sm v="ghost" onClick={()=>{setForm({nombre:s.nombre,dni:s.dni,planId:s.planId});setModal(s);}}>Editar</Btn>
                  <Btn sm v="ghost" onClick={()=>toggleActivo(s)}>{s.activo?"Suspender":"Activar"}</Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal&&(
        <Modal titulo={modal==="nuevo"?"Nuevo Socio":"Editar Socio"} onCerrar={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Campo label="NOMBRE COMPLETO"><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Juan Pérez" autoFocus/></Campo>
            <Campo label="DNI (sin puntos)"><input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value.replace(/\D/g,"")})} placeholder="Ej: 12345678" maxLength={9}/></Campo>
            <Campo label="PLAN">
              <select value={form.planId} onChange={e=>setForm({...form,planId:e.target.value})}>
                {planes.map(p=><option key={p.id} value={p.id}>{p.tipo==="ESPECÍFICO"?"🎯":"⚡"} {p.label} — ${Number(p.precio).toLocaleString("es-AR")} {p.tipo==="ESPECÍFICO"?"(Específico)":""}</option>)}
              </select>
            </Campo>
            {modal==="nuevo"&&(
              <div style={{background:C.accentGlow,border:`1px solid ${C.accent}30`,borderRadius:8,padding:"9px 14px",fontSize:12,color:C.accent}}>
                💡 Se acreditarán <strong>{(planes.find(p=>p.id===form.planId)||planes[0]).clases} clases</strong> al crear el socio.
              </div>
            )}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
              <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn onClick={guardarSocio} disabled={!form.nombre.trim()||!form.dni.trim()}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {renovar&&(
        <Modal titulo={`Renovar · ${renovar.nombre}`} onCerrar={()=>setRenovar(null)}>
          <p style={{color:C.muted,fontSize:13,marginBottom:14}}>Elegí el plan que pagó. Las clases se suman al saldo actual.</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {planes.map(p=>{
              const esEsp=p.tipo==="ESPECÍFICO";
              return (
                <button key={p.id} onClick={()=>doRenovar(renovar,p.id)} style={{background:C.card2,border:`1px solid ${esEsp?C.dep+"60":C.border}`,borderRadius:10,padding:"12px 16px",textAlign:"left",color:C.text,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:"'Barlow Condensed'",fontSize:18,fontWeight:700}}>{esEsp?"🎯":"⚡"} {p.label}</span>
                    <span style={{fontFamily:"'Barlow Condensed'",fontSize:20,fontWeight:800,color:esEsp?C.dep:C.accent}}>${Number(p.precio).toLocaleString("es-AR")}</span>
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>+ {p.clases} clases · {p.desc}</div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop:14,textAlign:"right"}}><Btn v="ghost" onClick={()=>setRenovar(null)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ─── Admin: Clases ────────────────────────────────────────────────────────────
function AdminClases({datos,guardar}) {
  const {socios,clases,bookings,planes}=datos;
  const [diaActivo,setDiaActivo]=useState(fmt(hoy()));
  const [modalClase,setModalClase]=useState(null);
  const [modalAnotar,setModalAnotar]=useState(null);
  const [modalSemana,setModalSemana]=useState(false);
  const [socioSelec,setSocioSelec]=useState("");
  const [errAnotar,setErrAnotar]=useState("");
  const [form,setForm]=useState({nombre:"",instructor:"",dia:fmt(hoy()),hora:"09:00",capacidad:10});

  const semana=Array.from({length:7},(_,i)=>addDays(getLunes(hoy()),i));
  const clasesDia=clases.filter(c=>c.dia===diaActivo).sort((a,b)=>a.hora.localeCompare(b.hora));
  const inscEn=cId=>bookings.filter(b=>b.claseId===cId).length;
  const yaAnotado=(cId,sId)=>bookings.some(b=>b.claseId===cId&&b.socioId===sId);
  const getPlan=id=>planes.find(p=>p.id===id)||planes[0];

  const guardarClase=async()=>{
    if(!form.nombre) return;
    const t=getTipo(form.nombre);
    const payload={...form,capacidad:Number(form.capacidad),color:t.color};
    let nuevas;
    if(modalClase==="nuevo") nuevas=[...clases,{...payload,id:`c${Date.now()}`}];
    else nuevas=clases.map(c=>c.id===modalClase.id?{...c,...payload}:c);
    await guardar({...datos,clases:nuevas}); setModalClase(null);
  };

  const eliminarClase=async id=>{
    if(!window.confirm("¿Eliminar clase? Se devolverán las clases a los inscriptos.")) return;
    const aDevolver=bookings.filter(b=>b.claseId===id);
    let nuevosSocios=socios.map(s=>{const dev=aDevolver.filter(b=>b.socioId===s.id).length; return dev>0?{...s,clasesRestantes:s.clasesRestantes+dev}:s;});
    await guardar({...datos,clases:clases.filter(c=>c.id!==id),bookings:bookings.filter(b=>b.claseId!==id),socios:nuevosSocios});
  };

  const confirmarAnotar=async()=>{
    setErrAnotar("");
    const sId=Number(socioSelec);
    const socio=socios.find(s=>s.id===sId);
    if(!socio||!socio.activo){setErrAnotar("Socio no válido.");return;}
    if(socio.clasesRestantes<=0){setErrAnotar("❌ El socio no tiene clases disponibles.");return;}
    if(yaAnotado(modalAnotar.id,sId)){setErrAnotar("Ya está anotado.");return;}
    if(inscEn(modalAnotar.id)>=modalAnotar.capacidad){setErrAnotar("La clase está llena.");return;}
    await guardar({...datos,bookings:[...bookings,{id:Date.now(),socioId:sId,claseId:modalAnotar.id}],socios:socios.map(s=>s.id===sId?{...s,clasesRestantes:s.clasesRestantes-1}:s)});
    setModalAnotar(null); setSocioSelec("");
  };

  const darDeBaja=async(claseId,socioId)=>{
    await guardar({...datos,bookings:bookings.filter(b=>!(b.claseId===claseId&&b.socioId===socioId)),socios:socios.map(s=>s.id===socioId?{...s,clasesRestantes:s.clasesRestantes+1}:s)});
  };

  const noSePresentó=async(claseId,socioId)=>{
    await guardar({...datos,bookings:bookings.filter(b=>!(b.claseId===claseId&&b.socioId===socioId))});
  };

  const generarSem=async()=>{
    const nuevas=generarSemana(getLunes(hoy()));
    const custom=clases.filter(c=>!c.id.startsWith("s"));
    await guardar({...datos,clases:[...custom,...nuevas]}); setModalSemana(false);
  };

  const disponibles=modalAnotar?socios.filter(s=>s.activo&&s.clasesRestantes>0&&!yaAnotado(modalAnotar.id,s.id)):[];

  return (
    <div>
      <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4,alignItems:"center"}}>
        {semana.map(d=>{
          const dow=d.getDay(); if(dow===0||dow===6) return null;
          const ds=fmt(d); const sel=ds===diaActivo;
          const cnt=clases.filter(c=>c.dia===ds).length;
          return (
            <button key={ds} onClick={()=>setDiaActivo(ds)} style={{background:sel?`linear-gradient(135deg,${C.accent},${C.accentDark})`:C.card,color:sel?"#091214":C.muted,border:`1px solid ${sel?C.accent:C.border}`,borderRadius:10,padding:"8px 11px",minWidth:62,display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:700}}>{DIAS_C[dow]}</span>
              <span style={{fontSize:22,fontFamily:"'Barlow Condensed'",fontWeight:800,lineHeight:1.1}}>{d.getDate()}</span>
              {cnt>0&&<span style={{fontSize:10,background:sel?"#09121430":C.accentGlow,color:sel?"#091214":C.accent,borderRadius:99,padding:"0 6px",fontWeight:700}}>{cnt}</span>}
            </button>
          );
        })}
        <div style={{marginLeft:"auto",display:"flex",gap:6,flexShrink:0}}>
          <Btn sm v="ghost" onClick={()=>setModalSemana(true)}>🗓 Semana</Btn>
          <Btn sm onClick={()=>{setForm({nombre:"",instructor:"",dia:diaActivo,hora:"09:00",capacidad:10});setModalClase("nuevo");}}>+ Clase</Btn>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {clasesDia.length===0&&(
          <div style={{textAlign:"center",padding:52,color:C.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>📭</div>Sin clases.
            <div style={{marginTop:12,display:"flex",gap:8,justifyContent:"center"}}>
              <Btn sm onClick={()=>{setForm({nombre:"",instructor:"",dia:diaActivo,hora:"09:00",capacidad:10});setModalClase("nuevo");}}>+ Agregar</Btn>
              <Btn sm v="ghost" onClick={()=>setModalSemana(true)}>🗓 Generar semana</Btn>
            </div>
          </div>
        )}
        {clasesDia.map(cls=>{
          const cnt=inscEn(cls.id); const llena=cnt>=cls.capacidad;
          const tp=getTipo(cls.nombre);
          const ins=bookings.filter(b=>b.claseId===cls.id).map(b=>({...b,socio:socios.find(s=>s.id===b.socioId)})).filter(b=>b.socio);
          return (
            <div key={cls.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",flexWrap:"wrap"}}>
                <div style={{width:3,height:46,borderRadius:4,background:cls.color,flexShrink:0}}/>
                <span style={{fontSize:20}}>{tp.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:2}}>
                    <span style={{fontFamily:"'Barlow Condensed'",fontSize:21,fontWeight:800}}>{cls.nombre}</span>
                    <Tag color={llena?C.danger:C.ok} sm>{llena?"LLENO":`${cls.capacidad-cnt} lugar${cls.capacidad-cnt!==1?"es":""}`}</Tag>
                  </div>
                  <div style={{color:C.muted,fontSize:12}}>🕐 {cls.hora}{cls.instructor?` · 👤 ${cls.instructor}`:""} · {cnt}/{cls.capacidad}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {!llena&&<Btn sm onClick={()=>{setModalAnotar(cls);setSocioSelec("");setErrAnotar("");}}>+ Anotar</Btn>}
                  <Btn sm v="ghost" onClick={()=>{setForm({nombre:cls.nombre,instructor:cls.instructor||"",dia:cls.dia,hora:cls.hora,capacidad:cls.capacidad});setModalClase(cls);}}>✏️</Btn>
                  <Btn sm v="danger" onClick={()=>eliminarClase(cls.id)}>✕</Btn>
                </div>
              </div>
              {ins.length>0&&(
                <div style={{borderTop:`1px solid ${C.border}`,padding:"9px 16px",display:"flex",flexWrap:"wrap",gap:6}}>
                  {ins.map(({socio,claseId,socioId})=>(
                    <div key={socioId} style={{display:"flex",alignItems:"center",gap:5,background:C.card2,borderRadius:8,padding:"4px 10px",fontSize:13,border:`1px solid ${C.border}`}}>
                      <span style={{fontWeight:500}}>{socio.nombre}</span>
                      <span style={{color:C.muted,fontSize:11}}>({socio.clasesRestantes})</span>
                      <button title="Dar de baja (devuelve clase)" onClick={()=>darDeBaja(claseId,socioId)} style={{background:"none",border:"none",color:C.ok,fontSize:16,lineHeight:1,marginLeft:2,cursor:"pointer"}}>↩</button>
                      <button title="No se presentó (no devuelve)" onClick={()=>noSePresentó(claseId,socioId)} style={{background:"none",border:"none",color:C.danger,fontSize:15,lineHeight:1,cursor:"pointer"}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalClase&&(
        <Modal titulo={modalClase==="nuevo"?"Nueva Clase":"Editar Clase"} onCerrar={()=>setModalClase(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Campo label="TIPO"><select value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}><option value="">-- seleccionar --</option>{TIPOS.map(t=><option key={t.nombre} value={t.nombre}>{t.emoji} {t.nombre}</option>)}</select></Campo>
            <Campo label="INSTRUCTOR (opcional)"><input value={form.instructor} onChange={e=>setForm({...form,instructor:e.target.value})} placeholder="Ej: Carlos V."/></Campo>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Campo label="FECHA"><input type="date" value={form.dia} onChange={e=>setForm({...form,dia:e.target.value})}/></Campo>
              <Campo label="HORARIO"><input type="time" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})}/></Campo>
            </div>
            <Campo label="CAPACIDAD"><input type="number" min="1" max="30" value={form.capacidad} onChange={e=>setForm({...form,capacidad:e.target.value})}/></Campo>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn v="ghost" onClick={()=>setModalClase(null)}>Cancelar</Btn>
              <Btn onClick={guardarClase} disabled={!form.nombre}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {modalAnotar&&(
        <Modal titulo={`Anotar · ${modalAnotar.nombre}`} onCerrar={()=>setModalAnotar(null)}>
          <div style={{background:C.accentGlow,border:`1px solid ${C.accent}30`,borderRadius:8,padding:"9px 14px",fontSize:13,color:C.accent,marginBottom:16}}>🕐 {modalAnotar.hora} · {inscEn(modalAnotar.id)}/{modalAnotar.capacidad}</div>
          {disponibles.length===0
            ?<div style={{textAlign:"center",padding:"20px 0",color:C.warn}}>⚠️ Sin socios disponibles.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Campo label="SOCIO"><select value={socioSelec} onChange={e=>{setSocioSelec(e.target.value);setErrAnotar("");}}><option value="">-- elegir --</option>{disponibles.map(s=><option key={s.id} value={s.id}>{s.nombre} · {s.clasesRestantes} clases</option>)}</select></Campo>
              {errAnotar&&<div style={{background:`${C.danger}15`,border:`1px solid ${C.danger}40`,borderRadius:8,padding:"9px 14px",fontSize:13,color:C.danger}}>{errAnotar}</div>}
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <Btn v="ghost" onClick={()=>setModalAnotar(null)}>Cancelar</Btn>
                <Btn onClick={confirmarAnotar} disabled={!socioSelec}>✅ Confirmar</Btn>
              </div>
            </div>
          }
        </Modal>
      )}

      {modalSemana&&(
        <Modal titulo="Generar semana" onCerrar={()=>setModalSemana(false)}>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:20}}>Cargará las clases Lun–Vie según el horario oficial. Las personalizadas no se tocarán.</p>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn v="ghost" onClick={()=>setModalSemana(false)}>Cancelar</Btn>
            <Btn onClick={generarSem}>🗓 Generar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Admin: Horarios ──────────────────────────────────────────────────────────
function AdminHorarios() {
  const manana=HORARIO_OFICIAL.filter(h=>parseInt(h.hora)<13);
  const tarde=HORARIO_OFICIAL.filter(h=>parseInt(h.hora)>=13);
  const horas=arr=>[...new Set(arr.map(h=>h.hora))].sort();
  const dias=[1,2,3,4,5];
  const Celda=({arr,hora,dia})=>{
    const e=arr.find(h=>h.hora===hora&&h.dia===dia);
    if(!e) return <td style={{padding:"5px 4px",textAlign:"center",color:C.border,borderBottom:`1px solid ${C.border}`,fontSize:11}}>—</td>;
    const t=getTipo(e.nombre);
    return <td style={{padding:"4px",borderBottom:`1px solid ${C.border}`}}><div style={{background:t.color+"1a",border:`1px solid ${t.color}40`,borderRadius:7,padding:"5px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:700,color:t.color,lineHeight:1.3}}>{t.emoji} {e.nombre.replace("Específico Deportivo","Esp. Dep.")}</div></div></td>;
  };
  const Tabla=({data,label})=>(
    <div style={{marginBottom:22}}>
      <div style={{fontFamily:"'Barlow Condensed'",fontSize:17,fontWeight:800,color:C.accent,marginBottom:10,letterSpacing:1}}>{label}</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:380}}>
          <thead><tr><th style={{padding:"7px 10px",color:C.muted,fontWeight:700,fontSize:10,textAlign:"left",borderBottom:`1px solid ${C.border}`}}>HORA</th>{dias.map(d=><th key={d} style={{padding:"7px 5px",color:C.muted,fontWeight:700,fontSize:10,textAlign:"center",borderBottom:`1px solid ${C.border}`}}>{DIAS_L[d].slice(0,3).toUpperCase()}</th>)}</tr></thead>
          <tbody>{horas(data).map(hora=><tr key={hora}><td style={{padding:"7px 10px",fontFamily:"'Barlow Condensed'",fontSize:20,fontWeight:800,color:C.text,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{hora}</td>{dias.map(d=><Celda key={d} arr={data} hora={hora} dia={d}/>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{marginBottom:16,padding:"11px 16px",background:C.accentGlow,border:`1px solid ${C.accent}30`,borderRadius:12,fontSize:13,color:C.accent}}>📋 Horario oficial F-Box · Lunes a Viernes · 10 personas por clase</div>
      {manana.length>0&&<Tabla data={manana} label="☀️ Mañana"/>}
      <Tabla data={tarde} label="🌆 Tarde"/>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:4}}>{TIPOS.map(t=><div key={t.nombre} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><div style={{width:10,height:10,borderRadius:3,background:t.color}}/><span style={{color:C.muted}}>{t.emoji} {t.nombre}</span></div>)}</div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [sesion,setSesion]=useState(null);
  const [datos,setDatos]=useState(null);

  useEffect(()=>{
    (async()=>{
      const d=await loadAll();
      // Migrar datos viejos que no tengan planes/inscripcion
      if(d&&!d.planes) d.planes=PLANES_DEFAULT;
      if(d&&!d.inscripcion) d.inscripcion=INSCRIPCION_DEFAULT;
      setDatos(d||DATOS_INIT());
    })();
  },[]);

  const guardar=async(nd)=>{ setDatos(nd); await saveAll(nd); };

  if(!datos) return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16}}>
        <Logo size={52}/><div style={{color:C.muted,fontSize:13}}>Cargando...</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {!sesion&&<Login socios={datos.socios} onAdmin={()=>setSesion("admin")} onSocio={s=>setSesion({tipo:"socio",socioId:s.id})}/>}
      {sesion==="admin"&&<PanelAdmin datos={datos} guardar={guardar} onSalir={()=>setSesion(null)}/>}
      {sesion?.tipo==="socio"&&<PortalSocio socioId={sesion.socioId} datos={datos} guardar={guardar} onSalir={()=>setSesion(null)}/>}
    </>
  );
}

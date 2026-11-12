'use strict';
const NS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={},text)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=text;return e};
const pos={A:{x:140,y:110},B:{x:310,y:115},C:{x:480,y:220},D:{x:300,y:345}};
// Exact historical multigraph: A-B twice, A-C once, B-C once, B-D twice, C-D once.
// Degrees: A=3, B=5, C=3, D=3.
const edges=[{id:1,a:'A',b:'B',curve:-32},{id:2,a:'A',b:'B',curve:32},{id:3,a:'A',b:'C',curve:-48},{id:4,a:'B',b:'C',curve:4},{id:5,a:'B',b:'D',curve:-40},{id:6,a:'B',b:'D',curve:40},{id:7,a:'C',b:'D',curve:4}];
const label={A:'Ribera norte',B:'Isla central',C:'Ribera este',D:'Ribera sur'};
const P=(a,b,curve=0,scale=1)=>{const x1=a.x*scale,y1=a.y*scale,x2=b.x*scale,y2=b.y*scale,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,mx=(x1+x2)/2-dy/len*curve*scale,my=(y1+y2)/2+dx/len*curve*scale;return {d:`M${x1},${y1} Q${mx},${my} ${x2},${y2}`,mid:{x:(x1+2*mx+x2)/4,y:(y1+2*my+y2)/4}}};
const addText=(svg,x,y,t,attr={})=>svg.appendChild(svgEl('text',{x,y,...attr},t));
const stylePoint=(svg,p,t,active=false,r=25)=>{svg.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r,fill:active?'#f5bc68':'#216574',stroke:active?'#fff0cf':'#c5e0d9','stroke-width':2}));addText(svg,p.x,p.y+6,t,{'text-anchor':'middle',fill:active?'#17323c':'#fff','font-size':18,'font-weight':800})};
// WALK: traversing exact edge identities matters, because there are parallel bridges.
let walkStart=null,walkAt=null,walkUsed=[],walkPath=[];let walkView='map';
// Las dos vistas comparten la misma conectividad, pero NO la misma representación.
// Los trayectos se dibujan de manera independiente para separar los puentes paralelos.
const walkMapNodes={A:{x:100,y:155},B:{x:306,y:170},C:{x:538,y:169},D:{x:302,y:355}};
const walkGraphNodes={A:{x:103,y:130},B:{x:296,y:135},C:{x:533,y:212},D:{x:301,y:350}};
const mapPaths={
  1:'M123 128 C170 87 240 88 282 132',
  2:'M124 191 C166 232 240 231 282 198',
  3:'M104 121 C155 23 454 20 537 138',
  4:'M329 171 C395 171 462 170 514 169',
  5:'M279 191 C241 245 245 303 280 332',
  6:'M331 194 C367 245 360 305 324 334',
  7:'M514 195 C455 261 393 321 329 357'
};
const graphPaths={
  1:'M125 116 Q199 57 272 116',
  2:'M125 150 Q198 217 272 155',
  3:'M104 103 Q316 18 533 185',
  4:'M318 143 Q419 153 510 203',
  5:'M281 159 Q215 254 279 329',
  6:'M319 158 Q385 253 323 329',
  7:'M516 233 Q431 305 326 354'
};
// Posiciones de los números: deliberadamente alejadas entre sí.
const mapBadges={1:[202,101],2:[202,220],3:[329,48],4:[418,170],5:[244,274],6:[364,274],7:[416,290]};
const graphBadges={1:[199,82],2:[198,188],3:[332,72],4:[421,171],5:[248,252],6:[353,252],7:[421,301]};
const svgText=(parent,x,y,t,attrs={})=>addText(parent,x,y,t,attrs);
function drawWalkBackdrop(svg,map){
  svg.appendChild(svgEl('rect',{width:640,height:450,fill:map?'#286d88':'#173d4a'}));
  if(map){
    // Agua visible y masas de tierra independientes, sin marco blanco decorativo.
    const land=[
      ['M0 0 H162 L151 88 L138 252 L0 269 Z','#315f50'],
      ['M243 91 Q292 73 347 94 L355 237 Q317 251 261 242 Z','#3f7963'],
      ['M474 74 L640 22 V365 L512 335 L468 255 Z','#315f50'],
      ['M241 294 Q310 273 368 315 L390 450 H211 Z','#3a715e']
    ];
    for(const [d,fill] of land){svg.appendChild(svgEl('path',{d,fill,stroke:'#7ea89a','stroke-width':2,'stroke-opacity':'.42'}))}
    // Olas discretas para distinguir visualmente el agua de la tierra.
    for(const d of ['M8 309 Q83 291 149 307','M382 104 Q428 93 463 107','M391 390 Q474 373 559 394','M178 286 Q205 273 224 283'])svg.appendChild(svgEl('path',{d,stroke:'#95d0df','stroke-width':2,opacity:.25,fill:'none'}));
    svgText(svg,30,35,'MAPA CONCEPTUAL · AGUA Y TIERRA',{'font-size':10,'font-weight':750,'letter-spacing':'1.6',fill:'#c4e7ec'});
    svgText(svg,31,430,'Ilustración didáctica · no es un plano geográfico a escala',{'font-size':10,fill:'#d1e4df'});
  } else {
    for(let x=28;x<640;x+=32)for(let y=27;y<450;y+=32)svg.appendChild(svgEl('circle',{cx:x,cy:y,r:1,fill:'#47707a',opacity:.55}));
    svgText(svg,30,35,'GRAFO · SOLO IMPORTAN LAS CONEXIONES',{'font-size':10,'font-weight':750,'letter-spacing':'1.5',fill:'#b8d9dc'});
    svgText(svg,31,430,'4 vértices · 7 aristas (incluye conexiones paralelas)',{'font-size':11,fill:'#b7d4d6'});
  }
}
function redrawWalk(){
 const svg=document.querySelector('#bridge-board');svg.replaceChildren();const map=walkView==='map';
 const coords=map?walkMapNodes:walkGraphNodes,paths=map?mapPaths:graphPaths,badges=map?mapBadges:graphBadges;
 drawWalkBackdrop(svg,map);
 for(const e of edges){
   const done=walkUsed.includes(e.id),can=walkAt!==null&&(e.a===walkAt||e.b===walkAt),enabled=!done&&can;
   const g=svgEl('g',{class:'bridge-hit',role:'button',tabindex:enabled?'0':'-1','aria-disabled':String(!enabled),
     'aria-label':`Puente ${e.id}: ${label[e.a]} a ${label[e.b]}. ${done?'Ya cruzado':walkAt===null?'Selecciona primero un territorio':can?'Disponible desde tu ubicación':'No conecta con tu ubicación'}`});
   const d=paths[e.id],col=done?'#54c8a3':enabled?'#f6c574':'#aac3c5';
   if(map){
     // Pasarela con bordes y traviesas: se distingue inequívocamente de un camino.
     g.appendChild(svgEl('path',{d,fill:'none',stroke:'#142f39','stroke-width':25,'stroke-linecap':'round',opacity:.93}));
     g.appendChild(svgEl('path',{d,fill:'none',stroke:col,'stroke-width':18,'stroke-linecap':'round',opacity:done||enabled?1:.74,class:'bridge-line'}));
     g.appendChild(svgEl('path',{d,fill:'none',stroke:done?'#206a5c':'#865f42','stroke-width':2.5,'stroke-dasharray':'3 9',opacity:done?.6:.95,'stroke-linecap':'butt','pointer-events':'none'}));
   }else{
     g.appendChild(svgEl('path',{d,fill:'none',stroke:'#0d2935','stroke-width':12,'stroke-linecap':'round'}));
     g.appendChild(svgEl('path',{d,fill:'none',stroke:col,'stroke-width':5.5,'stroke-linecap':'round',opacity:done||enabled?1:.7,class:'bridge-line'}));
   }
   const [bx,by]=badges[e.id];
   g.appendChild(svgEl('circle',{cx:bx,cy:by,r:16,fill:done?'#207d65':enabled?'#f7c779':'#e3e9df',stroke:'#173b44','stroke-width':2.5}));
   svgText(g,bx,by+5,String(e.id),{'font-size':15,'font-weight':850,'text-anchor':'middle',fill:'#163b41','pointer-events':'none'});
   // Zona de clic generosa sobre todo el puente y sobre su identificador.
   g.appendChild(svgEl('path',{d,fill:'none',stroke:'transparent','stroke-width':32,'stroke-linecap':'round',class:'bridge-click-zone'}));
   g.appendChild(svgEl('circle',{cx:bx,cy:by,r:19,fill:'transparent',class:'bridge-click-zone'}));
   if(enabled){g.addEventListener('click',()=>stepWalk(e.id));g.addEventListener('keydown',evt=>{if(evt.key==='Enter'||evt.key===' '){evt.preventDefault();stepWalk(e.id)}})}
   else g.classList.add('bridge-unavailable');
   svg.appendChild(g);
 }
 for(const [key,p] of Object.entries(coords)){
   const g=svgEl('g',{role:'button',tabindex:walkStart===null?'0':'-1','aria-label':`Iniciar en ${label[key]}`,class:'bridge-hit territory-hit'});
   g.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:29,fill:walkAt===key?'#f5bc68':'#184554',stroke:'#f3e9d5','stroke-width':3.5}));
   svgText(g,p.x,p.y+7,key,{'text-anchor':'middle','font-size':23,'font-weight':850,fill:walkAt===key?'#17323c':'#fff'});
   const cy=p.y+(key==='D'?49:50);
   svgText(g,p.x,cy,label[key],{'text-anchor':'middle','font-size':map?12:11,'font-weight':700,fill:'#fff2cf','paint-order':'stroke','stroke':'#173d48','stroke-width':3.5,'stroke-linejoin':'round'});
   if(walkStart===null){g.addEventListener('click',()=>startWalk(key));g.addEventListener('keydown',evt=>{if(evt.key==='Enter'||evt.key===' '){evt.preventDefault();startWalk(key)}})}
   svg.appendChild(g)
 }
 document.querySelector('#progress-fraction').textContent=`${walkUsed.length} / 7`;
 document.querySelector('#progress-fill').style.width=(100*walkUsed.length/7)+'%';
 document.querySelector('#current-place').textContent=walkAt===null?'Elige un territorio':`${walkAt} · ${label[walkAt]}`;
 document.querySelector('#route-history').textContent=walkPath.length?walkPath.join(' → '):'Todavía no has comenzado.';
 const remaining=edges.filter(e=>!walkUsed.includes(e.id)&&(e.a===walkAt||e.b===walkAt));
 let msg='Selecciona A, B, C o D para iniciar. Cada número representa un puente distinto.';
 if(walkAt!==null){msg=`Has recorrido ${walkUsed.length} de 7 puentes. Selecciona un puente que conecte con tu territorio actual.`;
   if(walkUsed.length===7)msg='¡Has cruzado los siete puentes! ¿Has regresado al inicio?';
   else if(!remaining.length)msg=`No quedan puentes disponibles desde aquí: recorriste ${walkUsed.length} de 7. Intenta otra ruta.`;
   else if(walkUsed.length===6)msg='Solo queda un puente. ¿Puedes llegar a él desde tu posición?';
 }
 document.querySelector('#step-message').textContent=msg;
 const fact=document.querySelector('.mini-fact');if(fact)fact.hidden=walkUsed.length===0;
}
function startWalk(k){walkStart=k;walkAt=k;walkPath=[k];walkUsed=[];document.querySelector('#walk-hint').hidden=true;redrawWalk()}
function stepWalk(id){const e=edges.find(x=>x.id===id);if(walkAt===null||walkUsed.includes(id)||!(e.a===walkAt||e.b===walkAt))return;walkUsed.push(id);walkAt=e.a===walkAt?e.b:e.a;walkPath.push(walkAt);redrawWalk()}
document.querySelector('#reset-walk').addEventListener('click',()=>{walkStart=null;walkAt=null;walkUsed=[];walkPath=[];document.querySelector('#walk-hint').hidden=true;redrawWalk()});
document.querySelector('#hint-walk').addEventListener('click',()=>{const target=document.querySelector('#walk-hint');target.hidden=!target.hidden;target.textContent='Observa el número de puentes que llegan a cada territorio. Cada vez que entras a un territorio intermedio, necesitas otro puente para salir. ¿Cuántos territorios tienen un número impar de puentes?'});
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{walkView=btn.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});redrawWalk()}));
redrawWalk();
// Simple graphs for degree visualizations: nodes same as original, with seven (parallel) edges.
// Vistas de descubrimiento y laboratorio: la MISMA numeración que el simulador.
// Las curvas no comparten un punto central; cada puente tiene número y área táctil propios.
const compact=walkGraphNodes;
const compactPaths=graphPaths;
const compactBadges=graphBadges;
function drawStandard(svg,options={}){
 svg.replaceChildren();
 svg.appendChild(svgEl('rect',{x:0,y:0,width:640,height:450,fill:'#f8faf7',rx:12}));
 const ids=options.ids||edges.map(e=>e.id);
 for(const e of edges){
  const on=ids.includes(e.id),incident=options.focus&&(e.a===options.focus||e.b===options.focus),d=compactPaths[e.id];
  const col=on?(options.focus?(incident?'#d99b4d':'#b9cac6'):'#287c79'):'#cbd3ce';
  svg.appendChild(svgEl('path',{d,fill:'none',stroke:col,'stroke-width':incident?7:5,'stroke-linecap':'round','stroke-dasharray':on?'none':'8 9'}));
  const [bx,by]=compactBadges[e.id];
  const g=svgEl('g',{class:options.onEdge?'exp-hit':'',role:options.onEdge?'button':'img',tabindex:options.onEdge?'0':'-1','aria-label':`Puente ${e.id}, conecta ${e.a} con ${e.b}, ${on?'activo':'inactivo'}`});
  g.appendChild(svgEl('circle',{cx:bx,cy:by,r:options.onEdge?20:17,fill:on?'#fff2d9':'#ecefeb',stroke:on?'#53918b':'#b4c5bd','stroke-width':2}));
  addText(g,bx,by+5,String(e.id),{'font-size':15,'font-weight':800,'text-anchor':'middle',fill:'#294d50','pointer-events':'none'});
  if(options.onEdge){g.appendChild(svgEl('path',{d,stroke:'transparent','stroke-width':29,fill:'none'}));g.appendChild(svgEl('circle',{cx:bx,cy:by,r:23,fill:'transparent'}));const click=()=>options.onEdge(e.id);g.addEventListener('click',click);g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();click()}})}
  svg.appendChild(g);
 }
 for(const [key,p] of Object.entries(compact)){
  const g=svgEl('g',{role:options.onNode?'button':'img',tabindex:options.onNode?0:-1,'aria-label':`Vértice ${key}, ${edges.filter(e=>ids.includes(e.id)&&(e.a===key||e.b===key)).length} conexiones`,class:options.onNode?'degree-node':''});
  g.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:30,fill:options.focus===key?'#edb35d':'#205e68',stroke:'#fff','stroke-width':4}));
  addText(g,p.x,p.y+7,key,{'text-anchor':'middle','font-size':22,'font-weight':800,fill:options.focus===key?'#243c42':'#fff'});
  if(options.onNode){const click=()=>options.onNode(key);g.addEventListener('click',click);g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();click()}})}svg.appendChild(g)
 }
}
let degreeFocus=null;const degreeSvg=document.querySelector('#degree-board');let explored=new Set();
function degreeDraw(){drawStandard(degreeSvg,{focus:degreeFocus,onNode:k=>{degreeFocus=k;explored.add(k);degreeDraw()}});
 const message=document.querySelector('#degree-result');
 if(degreeFocus){const connections=edges.filter(e=>e.a===degreeFocus||e.b===degreeFocus);message.textContent=`Vértice ${degreeFocus}: grado ${connections.length} (${connections.length%2?'impar':'par'}). Puentes: ${connections.map(e=>e.id).join(', ')}. Cada puente paralelo cuenta por separado.`}
 document.querySelector('#degree-count').textContent=`Has explorado ${explored.size} de 4 vértices. ${explored.size===4?'Todos son impares: ¿qué efecto tendrá sobre el recorrido?':'Toca los restantes para comparar sus grados.'}`;
}degreeDraw();
document.querySelector('#reveal-rules').addEventListener('click',()=>document.querySelector('#euler-rules').scrollIntoView({behavior:'smooth',block:'center'}));
const caseSets={'0':[[0,1],[1,2],[2,3],[3,0]],'2':[[0,1],[1,2],[2,3]],'4':[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]};
const caseDescriptions={'0':'0 vértices impares: todos tienen grado 2. Puedes recorrer A → B → C → D → A y regresar al inicio.','2':'2 vértices impares: A y D tienen grado 1. Puedes recorrer A → B → C → D, sin regresar al inicio.','4':'4 vértices impares: todos tienen grado 3. No existe un único sendero que use todas las aristas una sola vez.'};
function paintCase(k){const svg=document.querySelector('#case-board');svg.replaceChildren();const p=[[60,45],[300,45],[300,140],[60,140]];for(const [a,b] of caseSets[k])svg.appendChild(svgEl('line',{x1:p[a][0],y1:p[a][1],x2:p[b][0],y2:p[b][1],stroke:'#428784','stroke-width':4}));for(let i=0;i<4;i++){const d=caseSets[k].filter(e=>e.includes(i)).length;svg.appendChild(svgEl('circle',{cx:p[i][0],cy:p[i][1],r:23,fill:d%2?'#d89c4a':'#286f71'}));addText(svg,p[i][0],p[i][1]+5,'ABCD'[i],{'text-anchor':'middle',fill:'#fff','font-size':16,'font-weight':800});addText(svg,p[i][0],p[i][1]+38,`grado ${d}`,{'text-anchor':'middle','font-size':12,fill:'#37575a'})}document.querySelector('#case-explanation').textContent=caseDescriptions[k];document.querySelectorAll('[data-case]').forEach(b=>{b.classList.toggle('active',b.dataset.case===k);b.setAttribute('aria-pressed',String(b.dataset.case===k))})}
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>paintCase(b.dataset.case)));paintCase('4');
let expIds=edges.map(e=>e.id);const expSvg=document.querySelector('#experiment-board');let mission='open',predicted=false;
const missions={open:{instruction:'META: consigue exactamente dos vértices impares, conservando conectados todos los vértices con puentes. Predice si será posible terminar en otro lugar.',hint:'Desde los siete puentes originales, prueba quitar solo el puente 3 (A–C).'},closed:{instruction:'META: consigue cero vértices impares y una red conectada. Predice si podrás volver al punto de partida.',hint:'Desde el grafo original, prueba quitar el puente 3 (A–C) y el 5 (B–D).'},original:{instruction:'META: vuelve a tener los siete puentes originales y explica por qué no hay recorrido euleriano.',hint:'Restablece los siete puentes y cuenta los grados de A, B, C y D.'},free:{instruction:'EXPLORACIÓN LIBRE: cambia las conexiones y observa el número de impares y la conectividad.',hint:'Una configuración con 0 impares permite un circuito; con 2, un sendero abierto (si está conectada).'}};
const activeGraph=()=>{const deg=Object.fromEntries(Object.keys(compact).map(k=>[k,edges.filter(e=>expIds.includes(e.id)&&(e.a===k||e.b===k)).length]));const active=Object.keys(deg).filter(k=>deg[k]>0);const seen=new Set();if(active.length){const q=[active[0]];seen.add(active[0]);while(q.length){const cur=q.shift();for(const e of edges.filter(e=>expIds.includes(e.id)&&(e.a===cur||e.b===cur))){const to=e.a===cur?e.b:e.a;if(!seen.has(to)){seen.add(to);q.push(to)}}}}return {deg,connected:active.every(k=>seen.has(k)),odd:Object.values(deg).filter(n=>n%2).length}};
function expDraw(){drawStandard(expSvg,{ids:expIds,onEdge:id=>{expIds=expIds.includes(id)?expIds.filter(x=>x!==id):[...expIds,id];document.querySelector('#mission-feedback').textContent='Configuración modificada. Comprueba tu hipótesis para recibir retroalimentación.';document.querySelector('#experiment-route-result').textContent='';expDraw()}});
 const {deg,connected,odd}=activeGraph();document.querySelector('#experiment-degrees').innerHTML=Object.entries(deg).map(([k,n])=>`<div class="degree-chip ${n%2?'odd':'even'}">Vértice ${k}<strong>${n}</strong>${n%2?'Impar':'Par'}</div>`).join('');
 let verdict='';if(!expIds.length)verdict='No hay puentes activos: no existe un recorrido no vacío que comprobar.';else if(!connected)verdict='Las aristas están en componentes separadas: no se pueden recorrer todas en una sola ruta.';else if(odd===0)verdict='Circuito posible: puedes recorrer cada puente activo una sola vez y regresar al inicio.';else if(odd===2)verdict='Sendero abierto posible: puedes recorrer cada puente activo una vez y terminar en un vértice distinto.';else verdict=`No es posible un sendero euleriano: ${odd} vértices tienen grado impar.`;
 document.querySelector('#experiment-conclusion').innerHTML=`<strong>${expIds.length} puente(s) activos · ${odd} vértice(s) impares</strong><br>${verdict}`;
}
function setMission(value){mission=value;predicted=false;expIds=edges.map(e=>e.id);document.querySelector('#mission-instruction').textContent=missions[value].instruction;document.querySelector('#mission-feedback').textContent='Comienza con los siete puentes. Registra tu predicción antes de experimentar.';document.querySelector('#experiment-route-result').textContent='';expDraw()}
document.querySelector('#mission-select').addEventListener('change',e=>setMission(e.target.value));
document.querySelector('#mission-predict').addEventListener('click',()=>{predicted=true;document.querySelector('#mission-feedback').textContent='Hipótesis registrada: ahora modifica los puentes y presiona «Comprobar mi hipótesis». Puedes cambiar de idea mientras experimentas.'});
document.querySelector('#mission-example').addEventListener('click',()=>{document.querySelector('#mission-feedback').textContent=missions[mission].hint});
document.querySelector('#mission-check').addEventListener('click',()=>{const {odd,connected}=activeGraph();const ok=expIds.length>0&&connected&&(mission==='free'||mission==='open'&&odd===2||mission==='closed'&&odd===0||mission==='original'&&odd===4&&expIds.length===7);document.querySelector('#mission-feedback').textContent=(ok?'¡Objetivo conseguido! ':'Todavía no cumples la meta. ')+(connected?'Las aristas activas están conectadas. ':'El grafo tiene partes desconectadas. ')+`Ahora hay ${odd} vértices impares. ${predicted?'Compara este resultado con tu hipótesis inicial.':'Prueba registrar una hipótesis antes de modificar los puentes.'}`});
document.querySelector('#reset-experiment').addEventListener('click',()=>setMission(mission));
// Construcción de testigo de Euler: cada arista se usa una sola vez (incluidas paralelas).
function eulerWitness(){const {connected,odd,deg}=activeGraph();if(!expIds.length||!connected||odd>2)return null;const start=Object.keys(deg).find(k=>deg[k]%2===1)||Object.keys(deg).find(k=>deg[k]>0);let stack=[start],route=[],used=new Set();while(stack.length){const v=stack[stack.length-1],e=edges.find(e=>expIds.includes(e.id)&&!used.has(e.id)&&(e.a===v||e.b===v));if(e){used.add(e.id);stack.push(e.a===v?e.b:e.a)}else route.push(stack.pop())}return used.size===expIds.length?route.reverse():null}
document.querySelector('#experiment-route').addEventListener('click',()=>{const witness=eulerWitness();document.querySelector('#experiment-route-result').textContent=witness?`Recorrido comprobado (${expIds.length} puentes): ${witness.join(' → ')}. Cada arista activa se usa una sola vez.`:'Esta configuración no permite un recorrido euleriano. Revisa la conectividad y los vértices impares.'});setMission('open');
// Three working mini-demos of modern applications.
const appData={routes:{category:'LOGÍSTICA',title:'¿Cuál es la ruta más corta?',description:'Una empresa debe transportar un paquete desde el almacén hasta el cliente. Las conexiones tienen costos diferentes: elegir el camino con menos tramos no siempre es lo más eficiente.',relation:'Tanto las calles como los puentes son aristas. Pero ahora buscamos minimizar el costo de una ruta, no recorrer todas las aristas.',note:'Costos simulados por tramo. Las rutas son ficticias.'},social:{category:'REDES SOCIALES',title:'¿Quién conecta a dos comunidades?',description:'Cada persona es un vértice y cada amistad una arista. Explora cómo ciertas personas conectan grupos y cómo cambia la red al eliminar una amistad.',relation:'En una red social estudiamos la conectividad, los vecinos y los intermediarios. El interés no es cruzar todos los enlaces como en Königsberg.',note:'Red ficticia: las conexiones representan amistades entre personas simuladas.'},knowledge:{category:'INTELIGENCIA ARTIFICIAL',title:'¿Cómo relaciona hechos un sistema?',description:'Un grafo de conocimiento conecta conceptos mediante relaciones con significado. Selecciona una consulta para seguir los vínculos y construir una respuesta explicable.',relation:'Los nodos representan entidades y las conexiones representan relaciones. Un grafo de conocimiento incorpora el significado de cada relación.',note:'Ejemplo didáctico de inferencia por relaciones; no representa un sistema de IA real.'}};
let app='routes',destination='E',removedFriend=false,query='q1';
const routeNodes={A:[73,157],B:[213,73],C:[220,250],D:[373,109],E:[475,235]};
const routeEdges=[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2]];
const shortest=(start,end)=>{const d={};const prev={};const q=new Set(Object.keys(routeNodes));for(const k of q)d[k]=Infinity;d[start]=0;while(q.size){let u=[...q].reduce((a,b)=>d[a]<=d[b]?a:b);q.delete(u);if(d[u]===Infinity||u===end)break;for(const [a,b,w] of routeEdges){const v=a===u?b:b===u?a:null;if(v&&q.has(v)&&d[u]+w<d[v]){d[v]=d[u]+w;prev[v]=u}}}const path=[];let x=end;while(x){path.unshift(x);if(x===start)break;x=prev[x]}return {path,cost:d[end]}};
const appSvg=document.querySelector('#app-board');
function appButton(text,active,fn){const b=document.createElement('button');b.textContent=text;b.classList.toggle('active',active);b.addEventListener('click',fn);return b}
let routeManual=['A'],routeMode='try',socialRemoval='none',knowledgeLinks=new Set();
const knowledgeRelations=[['Inventario','Pronóstico','utiliza'],['Pronóstico','Datos','requiere']];
function renderApp(){
 const info=appData[app];for(const [id,value] of [['app-category',info.category],['app-title',info.title],['app-description',info.description],['app-board-note',info.note]])document.getElementById(id).textContent=value;
 document.querySelector('#app-relation').innerHTML=`<strong>Conexión con Euler</strong> ${info.relation}`;
 document.querySelectorAll('[data-app]').forEach(b=>{const active=b.dataset.app===app;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});
 appSvg.replaceChildren();const controls=document.querySelector('#app-controls');controls.replaceChildren();const extra=document.querySelector('#app-extra');extra.replaceChildren();const outcome=document.querySelector('#app-outcome');
 const heading=document.createElement('span');heading.className='control-label';const opts=document.createElement('div');opts.className='option-buttons';controls.append(heading,opts);
 const para=(content)=>{const p=document.createElement('p');p.textContent=content;extra.append(p);return p};
 if(app==='routes'){
  heading.textContent='1. Elige un destino';for(const k of ['B','D','E'])opts.append(appButton(`Punto ${k}`,destination===k,()=>{destination=k;routeManual=['A'];routeMode='try';renderApp()}));
  para('Los números sobre las aristas son costos simulados por tramo. La ruta más eficiente tiene la MENOR SUMA, aunque use más conexiones.');
  const row=document.createElement('div');row.className='option-buttons';row.append(appButton('Intentarlo tú',routeMode==='try',()=>{routeMode='try';renderApp()}),appButton('Mostrar ruta óptima',routeMode==='optimal',()=>{routeMode='optimal';renderApp()}),appButton('Reiniciar ruta',false,()=>{routeManual=['A'];routeMode='try';renderApp()}));extra.append(row);
  const result=shortest('A',destination);let sum=0;for(let i=1;i<routeManual.length;i++){const a=routeManual[i-1],b=routeManual[i];sum+=routeEdges.find(e=>e[0]===a&&e[1]===b||e[1]===a&&e[0]===b)[2]}
  const path=routeMode==='optimal'?result.path:routeManual;
  for(const [a,b,w] of routeEdges){const aa=routeNodes[a],bb=routeNodes[b],isPath=path.some((x,i)=>x===a&&path[i+1]===b||x===b&&path[i+1]===a);appSvg.appendChild(svgEl('line',{x1:aa[0],y1:aa[1],x2:bb[0],y2:bb[1],stroke:isPath?'#ea9d47':'#8baca9','stroke-width':isPath?8:4,'stroke-linecap':'round'}));const mx=(aa[0]+bb[0])/2,my=(aa[1]+bb[1])/2;appSvg.appendChild(svgEl('circle',{cx:mx,cy:my,r:15,fill:'#fff',stroke:'#b9cfca'}));addText(appSvg,mx,my+4,w,{'text-anchor':'middle','font-size':13,'font-weight':800,fill:'#42686b'})}
  for(const [k,[x,y]] of Object.entries(routeNodes)){const g=svgEl('g',{role:'button',tabindex:0,'aria-label':`Seleccionar punto ${k}`,class:'interactive-node'});g.appendChild(svgEl('circle',{cx:x,cy:y,r:27,fill:k==='A'?'#173d49':k===destination?'#efb25b':'#2b7775'}));addText(g,x,y+6,k,{'text-anchor':'middle','font-size':20,'font-weight':800,fill:'#fff'});const click=()=>{if(routeMode==='optimal')routeMode='try';if(k==='A'){routeManual=['A'];renderApp();return}const last=routeManual.at(-1),link=routeEdges.find(e=>e[0]===k&&e[1]===last||e[1]===k&&e[0]===last);if(link&&!routeManual.includes(k)){routeManual.push(k);renderApp()}else{outcome.textContent='Selecciona un punto conectado con el último, sin repetir vértices. Toca A para reiniciar.'}};g.addEventListener('click',click);g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();click()}});appSvg.appendChild(g)}
  if(routeMode==='optimal')outcome.innerHTML=`<strong>Ruta óptima (Dijkstra):</strong> ${result.path.join(' → ')}<br><strong>Costo mínimo:</strong> ${result.cost}. Se buscan caminos con pesos no negativos.`;
  else outcome.innerHTML=`<strong>Tu ruta:</strong> ${routeManual.join(' → ')}<br><strong>Costo acumulado:</strong> ${sum} unidades. ${routeManual.at(-1)===destination?`¡Llegaste! Comparada con la óptima (${result.cost}), tu ruta cuesta ${sum-result.cost} unidades más.`:'Toca los vértices del grafo para avanzar hasta el destino elegido.'}`;
  para('Pregunta: ¿por qué una ruta con menos tramos podría resultar más costosa?');
 }
 if(app==='social'){
  heading.textContent='1. Predice qué ocurrirá al quitar una amistad';opts.append(appButton('Red completa',socialRemoval==='none',()=>{socialRemoval='none';renderApp()}),appButton('Quitar C–D',socialRemoval==='CD',()=>{socialRemoval='CD';renderApp()}),appButton('Quitar A–B',socialRemoval==='AB',()=>{socialRemoval='AB';renderApp()}));
  const points={A:[75,80],B:[175,60],C:[175,180],D:[345,180],E:[445,75],F:[445,275]};const links=[['A','B'],['A','C'],['B','C'],['C','D'],['D','E'],['D','F'],['E','F']];for(const [a,b] of links){const [x1,y1]=points[a],[x2,y2]=points[b],gone=socialRemoval===a+b;appSvg.appendChild(svgEl('line',{x1,y1,x2,y2,stroke:gone?'#c6d0c9':a==='C'?'#eb9f4e':'#74a4a3','stroke-width':gone?3:5,'stroke-dasharray':gone?'7 8':'none'}))}for(const [k,[x,y]] of Object.entries(points)){appSvg.appendChild(svgEl('circle',{cx:x,cy:y,r:27,fill:k==='C'||k==='D'?'#e5a254':'#236a73'}));addText(appSvg,x,y+6,k,{'text-anchor':'middle','font-size':19,'font-weight':800,fill:'#fff'})}
  outcome.textContent=socialRemoval==='CD'?'2 componentes: A–B–C y D–E–F. C–D es una arista puente; al quitarla se separa la red.':socialRemoval==='AB'?'1 componente: aunque quites A–B, A y B siguen conectados a través de C.':'1 componente: las seis personas pueden comunicarse por algún camino.';
  para('Compara: ¿por qué C–D separa dos comunidades y A–B no? En redes de telecomunicaciones, una conexión crítica puede producir el mismo efecto.');
 }
 if(app==='knowledge'){
  heading.textContent='1. Construye las relaciones';opts.append(appButton('Inventario → Pronóstico: utiliza',knowledgeLinks.has('utiliza'),()=>{knowledgeLinks.has('utiliza')?knowledgeLinks.delete('utiliza'):knowledgeLinks.add('utiliza');renderApp()}),appButton('Pronóstico → Datos: requiere',knowledgeLinks.has('requiere'),()=>{knowledgeLinks.has('requiere')?knowledgeLinks.delete('requiere'):knowledgeLinks.add('requiere');renderApp()}),appButton('Restablecer',false,()=>{knowledgeLinks.clear();renderApp()}));
  const points={Inventario:[124,90],Pronóstico:[389,90],Datos:[300,258]};const rel=[['Inventario','Pronóstico','utiliza'],['Pronóstico','Datos','requiere']];
  const defs=svgEl('defs');const marker=svgEl('marker',{id:'app-arrow',markerWidth:9,markerHeight:9,refX:7,refY:3,orient:'auto'});marker.appendChild(svgEl('path',{d:'M0 0 L7 3 L0 6 Z',fill:'#d99c45'}));defs.appendChild(marker);appSvg.appendChild(defs);
  for(const [a,b,lab] of rel){const [x1,y1]=points[a],[x2,y2]=points[b];const on=knowledgeLinks.has(lab);appSvg.appendChild(svgEl('line',{x1,y1,x2,y2,stroke:on?'#d99c45':'#9db5b1','stroke-width':on?5:3,'stroke-dasharray':on?'none':'7 7','marker-end':on?'url(#app-arrow)':'none'}));addText(appSvg,(x1+x2)/2,(y1+y2)/2-11,lab,{'text-anchor':'middle','font-size':14,'font-weight':700,fill:'#315e5a'})}
  for(const [name,[x,y]] of Object.entries(points)){const width=name.length*9+48;appSvg.appendChild(svgEl('rect',{x:x-width/2,y:y-27,width,height:54,rx:21,fill:name==='Pronóstico'?'#d79b4c':'#226b70'}));addText(appSvg,x,y+5,name,{'text-anchor':'middle','font-size':15,'font-weight':750,fill:'#fff'})}
  outcome.textContent=knowledgeLinks.size===2?'¡Cadena completa! Inventario utiliza Pronóstico; Pronóstico requiere Datos. Por lo tanto, Inventario depende indirectamente de Datos.':`Relaciones construidas: ${knowledgeLinks.size} de 2. Selecciona ambas para representar la dependencia completa.`;
  para('Pregunta: si faltan Datos, ¿qué sucede con el pronóstico y con la decisión de inventario? Las flechas indican relaciones dirigidas; un grafo por sí solo no constituye un sistema de IA con razonamiento.');
 }
}
document.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>{app=b.dataset.app;renderApp()}));renderApp();
const questions=[{q:'Si el grafo de Königsberg tiene cuatro vértices de grado impar, ¿puedes cruzar sus siete aristas una sola vez?',opts:['Sí, si comienzas en la isla','Sí, si no vuelves al inicio','No, porque tiene más de dos vértices impares'],answer:2,why:'Para un sendero euleriano en un grafo conexo debe haber cero o dos vértices impares. Aquí hay cuatro.'},{q:'En un sistema de navegación, ¿qué representan normalmente las calles que conectan intersecciones?',opts:['Las aristas','Los vértices','Los grados'],answer:0,why:'Las intersecciones pueden modelarse como vértices y los tramos de calle como aristas, a menudo con pesos de tiempo o distancia.'},{q:'Un grafo conexo tiene exactamente dos vértices de grado impar. ¿Qué recorrido es posible?',opts:['Solo un circuito cerrado','Un sendero euleriano abierto','Ningún recorrido de todas sus aristas'],answer:1,why:'Un sendero euleriano abierto empieza en uno de los vértices impares y termina en el otro.'}];
let quizIndex=0,quizScore=0,quizAnswered=false;
function drawQuiz(){const q=questions[quizIndex];document.querySelector('#quiz-step').textContent=quizIndex<3?`PREGUNTA ${quizIndex+1} DE 3`:'EVALUACIÓN COMPLETADA';document.querySelector('#quiz-score').textContent=`${quizScore} respuestas correctas`;document.querySelector('#quiz-fill').style.width=`${100*quizIndex/3}%`;const optionWrap=document.querySelector('#quiz-options');optionWrap.replaceChildren();document.querySelector('#quiz-feedback').textContent='';const next=document.querySelector('#quiz-next');next.hidden=true;if(quizIndex>=3){document.querySelector('#quiz-question').textContent=`Obtuviste ${quizScore} de 3 respuestas correctas.`;document.querySelector('#quiz-fill').style.width='100%';document.querySelector('#quiz-feedback').textContent=quizScore===3?'¡Excelente! Identificaste los principios centrales.':'Puedes consultar las explicaciones y volver a intentarlo.';next.hidden=false;next.textContent='↻ Intentar de nuevo';next.onclick=()=>{quizIndex=0;quizScore=0;drawQuiz()};return}document.querySelector('#quiz-question').textContent=q.q;q.opts.forEach((s,i)=>{const btn=document.createElement('button');btn.className='quiz-option';const l=document.createElement('span');l.className='choice-letter';l.textContent='ABC'[i];btn.append(l,document.createTextNode(s));btn.addEventListener('click',()=>{if(quizAnswered)return;quizAnswered=true;if(i===q.answer)quizScore++;optionWrap.querySelectorAll('button').forEach((b,j)=>{b.disabled=true;if(j===q.answer)b.classList.add('correct');else if(j===i)b.classList.add('incorrect')});document.querySelector('#quiz-feedback').textContent=(i===q.answer?'Correcto. ':'Revisa tu respuesta. ')+q.why;document.querySelector('#quiz-score').textContent=`${quizScore} respuestas correctas`;next.hidden=false;next.textContent=quizIndex===2?'Ver resultado →':'Siguiente pregunta →'});optionWrap.appendChild(btn)});quizAnswered=false;next.onclick=()=>{quizIndex++;drawQuiz()}}drawQuiz();
const glossary=[['Vértice (nodo)','Elemento que representa un lugar, una persona o un concepto.','Cada territorio de Königsberg es un vértice.'],['Arista','Conexión entre dos vértices.','Un puente que une dos territorios es una arista.'],['Grafo','Conjunto de vértices y aristas que representan elementos y relaciones.','Las cuatro tierras y los siete puentes forman un grafo.'],['Grado','Número de aristas incidentes en un vértice; un lazo cuenta dos veces en grafos no dirigidos.','La isla central tiene grado 5.'],['Grafo no dirigido','Las conexiones no tienen una dirección obligatoria.','Un puente por el que se puede pasar en ambos sentidos.'],['Grafo dirigido','Sus aristas, llamadas arcos, indican una dirección.','Una calle de un solo sentido.'],['Grafo conexo','Cualquier par de vértices está unido por alguna secuencia de aristas.','Puedes pasar de cualquier territorio a otro.'],['Camino (recorrido)','Secuencia de vértices y aristas conectados; según la convención, puede repetir elementos.','A → B → C es un recorrido.'],['Sendero','Recorrido que no repite ninguna arista.','Cruzas varios puentes sin volver a usar uno anterior.'],['Trayectoria (camino simple)','Recorrido que no repite vértices.','Visitas A → B → C sin volver a visitar A ni B.'],['Circuito','Recorrido cerrado que no repite aristas y contiene al menos una.','Un paseo que regresa al inicio sin reutilizar puentes.'],['Circuito simple','Circuito que no repite vértices salvo el inicial/final.','A → B → C → A, si esas aristas existen.'],['Sendero euleriano','Recorrido que usa todas las aristas del grafo exactamente una vez.','Cruzar los siete puentes sin repetir ninguno.'],['Circuito euleriano','Sendero euleriano que también regresa al vértice de partida.','Cruzar cada puente una vez y regresar al inicio.'],['Camino hamiltoniano','Recorrido que visita todos los vértices exactamente una vez.','Visitar cada territorio una sola vez.'],['Peso','Valor asociado a una arista, como costo, distancia o tiempo.','Una calle requiere 5 minutos de traslado.'],['Matriz de adyacencia','Tabla que indica qué vértices están conectados; en multigrafos puede contar aristas paralelas.','La celda A–B vale 2 si hay dos puentes entre A y B.'],['Isomorfismo','Correspondencia entre vértices de dos grafos que conserva las conexiones.','Un mapa de puntos puede reorganizarse sin cambiar las relaciones.'],['Árbol','Grafo conexo sin ciclos.','La estructura jerárquica de carpetas puede representarse como árbol.'],['Puente (arista de corte)','Arista cuya eliminación aumenta la cantidad de componentes conexas.','Si eliminar una amistad separa dos comunidades, es un puente en esa red.'],['Ciclo','Recorrido cerrado sin repetir vértices internos ni aristas.','Tres lugares conectados formando un triángulo.'],['Componente conexa','Grupo máximo de vértices que se conectan entre sí.','Dos grupos sin puentes entre ellos son componentes distintas.'],['Dijkstra','Algoritmo que calcula caminos de costo mínimo desde un origen cuando los pesos no son negativos.','Buscar la ruta más económica del almacén al cliente.'],['Grafo de conocimiento','Red de entidades y relaciones con significado.','Inventario utiliza Pronóstico, y Pronóstico requiere Datos.']];
function paintGlossary(){const txt=document.querySelector('#glossary-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const rows=glossary.filter(g=>g.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(txt));const wrap=document.querySelector('#glossary-grid');wrap.replaceChildren();for(const [term,def,example] of rows){const card=document.createElement('article');card.className='glossary-item';const h=document.createElement('h3');h.textContent=term;const p=document.createElement('p');p.textContent=def;const ex=document.createElement('p');ex.className='example';ex.textContent='Ejemplo: '+example;card.append(h,p,ex);wrap.appendChild(card)}document.querySelector('#glossary-count').textContent=`${rows.length} de ${glossary.length} conceptos`}
document.querySelector('#glossary-search').addEventListener('input',paintGlossary);paintGlossary();

// Menú accesible en pantallas pequeñas.
const mobileMenu=document.querySelector('#mobile-menu'),mainNav=document.querySelector('#main-nav');mobileMenu.addEventListener('click',()=>{const open=mainNav.classList.toggle('nav-open');mobileMenu.setAttribute('aria-expanded',String(open))});mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mainNav.classList.remove('nav-open');mobileMenu.setAttribute('aria-expanded','false')}));

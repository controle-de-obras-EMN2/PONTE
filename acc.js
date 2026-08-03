
(function(){
'use strict';

let accFluxos = [];
let accProcessos = [];
let accFiltrados = [];
let accMapa = null;
let accLayer = null;
let accCharts = {};
let accFeatureIndex = [];

const CONTRATOS_PADRAO = ['02069/22','00268/24','00272/24','00274/24','00277/24','00797/24','00900/24','01151/21','03179/23'];

function normalizar(txt){
    return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();
}
function normalizarContrato(v){
    let s = String(v || '').trim();
    if (!s || s === '-') return '';
    s = s.replace(/\s+/g,'');
    if (s.includes('/')) {
        const [a,b] = s.split('/');
        const n = (a || '').replace(/\D/g,'');
        const ano = (b || '').replace(/\D/g,'').slice(0,2);
        if (n && ano) return n.padStart(5,'0') + '/' + ano;
    }
    return s;
}
function numero(v){
    const n = Number(String(v || '0').replace(/\./g,'').replace(',','.'));
    return Number.isFinite(n) ? n : 0;
}
function csvParse(texto){
    const linhas = [];
    let linha = [], cel = '', aspas = false;
    for (let i=0; i<texto.length; i++) {
        const ch = texto[i], nx = texto[i+1];
        if (ch === '"') {
            if (aspas && nx === '"') { cel += '"'; i++; }
            else aspas = !aspas;
        } else if (ch === ';' && !aspas) {
            linha.push(cel); cel = '';
        } else if ((ch === '\n' || ch === '\r') && !aspas) {
            if (ch === '\r' && nx === '\n') i++;
            linha.push(cel); cel = '';
            if (linha.some(v => String(v).trim() !== '')) linhas.push(linha);
            linha = [];
        } else cel += ch;
    }
    if (cel || linha.length) { linha.push(cel); if (linha.some(v => String(v).trim() !== '')) linhas.push(linha); }
    if (!linhas.length) return [];
    let header = linhas.shift().map(h => h.replace(/^\uFEFF/, '').trim());
    return linhas.map(row => {
        const obj = {};
        header.forEach((h,i) => obj[h] = (row[i] || '').trim());
        return obj;
    });
}
async function carregarCsv(url){
    const resp = await fetch(url + '?v=' + Date.now());
    if (!resp.ok) return [];
    return csvParse(await resp.text());
}
function contar(arr, campo){
    const out = {};
    arr.forEach(r => {
        const k = r[campo] || 'Não informado';
        out[k] = (out[k] || 0) + 1;
    });
    return out;
}
function ordenarContrato(a,b){
    const ia = CONTRATOS_PADRAO.indexOf(a), ib = CONTRATOS_PADRAO.indexOf(b);
    if (ia >= 0 || ib >= 0) return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999);
    return String(a).localeCompare(String(b),'pt-BR');
}
function preencherSelect(id, valores, rotuloTodos){
    const el = document.getElementById(id);
    if (!el) return;
    const atual = el.value || 'TODOS';
    el.innerHTML = `<option value="TODOS">${rotuloTodos}</option>`;
    valores.filter(Boolean).forEach(v => {
        const op = document.createElement('option'); op.value = v; op.textContent = v; el.appendChild(op);
    });
    el.value = [...el.options].some(o => o.value === atual) ? atual : 'TODOS';
}
function initFiltros(){
    const contratos = Array.from(new Set([...CONTRATOS_PADRAO, ...accFluxos.map(r=>r.CONTRATO), ...accProcessos.map(r=>r.CONTRATO)])).filter(Boolean).sort(ordenarContrato);
    preencherSelect('accFiltroContrato', contratos, 'Todos os contratos');
    preencherSelect('accFiltroStatus', Array.from(new Set(accFluxos.map(r=>r.SITUACAO_GERAL))).sort(), 'Todos os status');
    preencherSelect('accFiltroFluxo', Array.from(new Set(accFluxos.map(r=>r['ABERTO/FECHADO']))).sort(), 'Aberto/fechado: todos');
    preencherSelect('accFiltroTipo', Array.from(new Set(accFluxos.map(r=>r.TIPO))).sort(), 'Todos os tipos');
    preencherSelect('accFiltroEtapa', Array.from(new Set(accFluxos.map(r=>r['ETAPA ATUAL DO PROCESSO']))).filter(v=>v && v !== '-').sort(), 'Todas as etapas');
    preencherSelect('accFiltroAgente', Array.from(new Set(accFluxos.map(r=>r['AGENTE DA SUPERVISÃO']))).filter(v=>v && v !== '-').sort(), 'Todos os agentes');
    ['accFiltroContrato','accFiltroStatus','accFiltroFluxo','accFiltroTipo','accFiltroEtapa','accFiltroAgente','accBusca'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(id === 'accBusca' ? 'input' : 'change', atualizarACC);
    });
    const limpar = document.getElementById('btnAccLimpar');
    if (limpar) limpar.addEventListener('click', () => {
        ['accFiltroContrato','accFiltroStatus','accFiltroFluxo','accFiltroTipo','accFiltroEtapa','accFiltroAgente'].forEach(id => { const e=document.getElementById(id); if(e) e.value='TODOS'; });
        const b=document.getElementById('accBusca'); if(b) b.value='';
        atualizarACC();
    });
    const csv = document.getElementById('btnAccCsv'); if (csv) csv.addEventListener('click', exportarAccCsv);
    const pdf = document.getElementById('btnAccPdf'); if (pdf) pdf.addEventListener('click', exportarAccPdf);
}
function obterFiltrados(){
    const contrato = document.getElementById('accFiltroContrato')?.value || 'TODOS';
    const status = document.getElementById('accFiltroStatus')?.value || 'TODOS';
    const fluxo = document.getElementById('accFiltroFluxo')?.value || 'TODOS';
    const tipo = document.getElementById('accFiltroTipo')?.value || 'TODOS';
    const etapa = document.getElementById('accFiltroEtapa')?.value || 'TODOS';
    const agente = document.getElementById('accFiltroAgente')?.value || 'TODOS';
    const busca = normalizar(document.getElementById('accBusca')?.value || '');
    return accFluxos.filter(r => {
        if (contrato !== 'TODOS' && r.CONTRATO !== contrato) return false;
        if (status !== 'TODOS' && r.SITUACAO_GERAL !== status) return false;
        if (fluxo !== 'TODOS' && r['ABERTO/FECHADO'] !== fluxo) return false;
        if (tipo !== 'TODOS' && r.TIPO !== tipo) return false;
        if (etapa !== 'TODOS' && r['ETAPA ATUAL DO PROCESSO'] !== etapa) return false;
        if (agente !== 'TODOS' && r['AGENTE DA SUPERVISÃO'] !== agente) return false;
        if (busca) {
            const hay = normalizar([r['N° DO FLUXO ACC'], r.FRENTE, r.TRECHO, r['ENDEREÇO'], r['ETAPA ATUAL DO PROCESSO']].join(' '));
            if (!hay.includes(busca)) return false;
        }
        return true;
    });
}
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }
function fmt(n){ return Number(n||0).toLocaleString('pt-BR'); }
function atualizarCards(){
    const f = accFiltrados;
    setText('accCardTotal', fmt(f.length));
    setText('accCardSemObjecao', fmt(f.filter(r=>r.SITUACAO_GERAL==='Sem objeção').length));
    setText('accCardComObjecao', fmt(f.filter(r=>r.SITUACAO_GERAL==='Com objeção').length));
    setText('accCardAnalise', fmt(f.filter(r=>r.SITUACAO_GERAL==='Em análise').length));
    setText('accCardAbertos', fmt(f.filter(r=>normalizar(r['ABERTO/FECHADO'])==='ABERTO').length));
    setText('accCardPendencia', fmt(f.filter(r=>r.PENDENCIA_DOCUMENTAL==='Sim').length));
}
function corStatus(st){
    const n = normalizar(st);
    if (n.includes('COM OBJ')) return '#ef4444';
    if (n.includes('EM ANALISE')) return '#f59e0b';
    if (n.includes('SEM OBJ')) return '#22c55e';
    return '#3b82f6';
}
function classeStatus(st){
    const n = normalizar(st);
    if (n.includes('COM OBJ')) return 'acc-status-pill acc-status-com';
    if (n.includes('EM ANALISE')) return 'acc-status-pill acc-status-analise';
    if (n.includes('SEM OBJ')) return 'acc-status-pill acc-status-sem';
    return 'acc-status-pill acc-status-na';
}
const accDoughnutPercentPlugin = {
    id: 'accDoughnutPercentPlugin',
    afterDatasetsDraw(chart, args, pluginOptions) {
        if (!pluginOptions || pluginOptions.enabled === false) return;
        if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;

        const dataset = chart.data.datasets && chart.data.datasets[0];
        if (!dataset || !Array.isArray(dataset.data)) return;

        const total = dataset.data.reduce((soma, valor) => soma + (Number(valor) || 0), 0);
        if (!total) return;

        const meta = chart.getDatasetMeta(0);
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = pluginOptions.font || 'bold 12px Arial';
        ctx.fillStyle = pluginOptions.color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.35)';
        ctx.shadowBlur = 3;

        meta.data.forEach((arc, index) => {
            const valor = Number(dataset.data[index]) || 0;
            if (!valor) return;

            const porcentagem = (valor / total) * 100;
            const props = arc.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'], true);
            const angulo = (props.startAngle + props.endAngle) / 2;
            const raio = (props.innerRadius + props.outerRadius) / 2;
            const x = props.x + Math.cos(angulo) * raio;
            const y = props.y + Math.sin(angulo) * raio;

            const texto = porcentagem.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
            ctx.fillText(texto, x, y);
        });

        ctx.restore();
    }
};

function chart(id, tipo, labels, datasets, options={}){
    const ctx = document.getElementById(id);
    if (!ctx || !window.Chart) return;
    if (accCharts[id]) accCharts[id].destroy();

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: tipo === 'doughnut' || tipo === 'pie' ? {} : { y: { beginAtZero: true } }
    };

    const finalOptions = Object.assign({}, baseOptions, options);
    finalOptions.plugins = Object.assign({}, baseOptions.plugins, options.plugins || {});
    finalOptions.scales = options.scales || baseOptions.scales;

    accCharts[id] = new Chart(ctx, {
        type: tipo,
        data: { labels, datasets },
        options: finalOptions,
        plugins: [accDoughnutPercentPlugin]
    });
}
function atualizarGraficos(){
    const f = accFiltrados;
    const status = contar(f, 'SITUACAO_GERAL');
    const labelsStatus = ['Sem objeção','Com objeção','Em análise','Não informado'].filter(l => status[l]);
    chart('graficoACCStatus','doughnut',labelsStatus,[{
        data: labelsStatus.map(l=>status[l]),
        backgroundColor: labelsStatus.map(corStatus),
        borderColor: '#ffffff',
        borderWidth: 2
    }], {
        cutout: '58%',
        plugins: {
            accDoughnutPercentPlugin: { enabled: true }
        }
    });

    const tipos = Object.entries(contar(f,'TIPO')).sort((a,b)=>b[1]-a[1]).slice(0,10);
    chart('graficoACCTipo','bar',tipos.map(x=>x[0]),[{ label:'Fluxos', data:tipos.map(x=>x[1]) }]);

    const contratos = Array.from(new Set([...CONTRATOS_PADRAO, ...f.map(r=>r.CONTRATO)])).filter(Boolean).sort(ordenarContrato);
    chart('graficoACCContrato','bar',contratos,[{ label:'Fluxos', data:contratos.map(c=>f.filter(r=>r.CONTRATO===c).length) }]);

    const disc = ['COMUNICAÇÃO','QUALIDADE','SST','SUPERVISÃO'];
    const st = ['Sem objeção','Com objeção','Em análise','Não se aplica','Não informado'];
    chart('graficoACCDisciplina','bar',disc,st.map(s=>({ label:s, data:disc.map(d=>f.filter(r=>r[d + '_STATUS']===s).length), backgroundColor: corStatus(s) })), { scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}} });

    const etapas = Object.entries(contar(f,'ETAPA ATUAL DO PROCESSO')).filter(([k])=>k && k !== '-').sort((a,b)=>b[1]-a[1]).slice(0,10);
    chart('graficoACCEtapa','bar',etapas.map(x=>x[0]),[{ label:'Fluxos', data:etapas.map(x=>x[1]) }], { indexAxis:'y', scales:{x:{beginAtZero:true}} });
}
function processosFiltrados(){
    const contrato = document.getElementById('accFiltroContrato')?.value || 'TODOS';
    return accProcessos.filter(r => contrato === 'TODOS' || r.CONTRATO === contrato);
}
function atualizarProcessos(){
    const p = processosFiltrados();
    const total = p.reduce((s,r)=>s+numero(r.QUANTIDADE_PROCESSOS_ARSESP),0);
    const aprov = p.reduce((s,r)=>s+numero(r.APROVADOS_TOTAL),0);
    const pend = p.reduce((s,r)=>s+numero(r.PENDENTE_APROVACAO),0);
    const segObj = p.reduce((s,r)=>s+numero(r.SEGURANCA_OBJETADO),0);
    const supObj = p.reduce((s,r)=>s+numero(r.SUPERVISAO_OBJETADO),0);
    setText('accProcTotal', fmt(total)); setText('accProcAprovados', fmt(aprov)); setText('accProcPendentes', fmt(pend)); setText('accProcSegObj', fmt(segObj)); setText('accProcSupObj', fmt(supObj));

    const contratos = Array.from(new Set([...CONTRATOS_PADRAO, ...p.map(r=>r.CONTRATO)])).filter(Boolean).sort(ordenarContrato);
    chart('graficoACCProcessosContrato','bar',contratos,[
        { label:'Mapeamento', data:contratos.map(c=>p.filter(r=>r.CONTRATO===c && normalizar(r.TIPO_PROCESSO).includes('MAPEAMENTO')).reduce((s,r)=>s+numero(r.QUANTIDADE_PROCESSOS_ARSESP),0)) },
        { label:'Liberação', data:contratos.map(c=>p.filter(r=>r.CONTRATO===c && normalizar(r.TIPO_PROCESSO).includes('LIBERACAO')).reduce((s,r)=>s+numero(r.QUANTIDADE_PROCESSOS_ARSESP),0)) }
    ]);
    chart('graficoACCProcessosStatus','bar',['Aprovados','Pendente aprovação','Obj. Segurança','Obj. Supervisão'],[{ label:'Processos', data:[aprov, pend, segObj, supObj], backgroundColor:['#22c55e','#f59e0b','#ef4444','#fb7185'] }]);
}
function escapeHtml(s){ return String(s||'').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function atualizarTabela(){
    const body = document.getElementById('accTabelaBody'); if (!body) return;
    setText('accTabelaResumo', `${fmt(accFiltrados.length)} registros`);
    body.innerHTML = accFiltrados.map((r,idx) => {
        const loc = localizarFluxo(r);
        const mapa = loc ? `<a href="${criarUrlMapa(r, loc)}" target="_blank">Ver</a>` : '-';
        return `<tr>
            <td title="${escapeHtml(r['N°'])}">${escapeHtml(r['N°'])}</td>
            <td>${escapeHtml(r.CONTRATO)}</td>
            <td>${escapeHtml(r['N° DO FLUXO ACC'])}</td>
            <td><span class="${classeStatus(r.SITUACAO_GERAL)}">${escapeHtml(r.SITUACAO_GERAL)}</span></td>
            <td>${escapeHtml(r['ABERTO/FECHADO'])}</td>
            <td title="${escapeHtml(r.TIPO)}">${escapeHtml(r.TIPO)}</td>
            <td title="${escapeHtml(r.FRENTE)}">${escapeHtml(r.FRENTE)}</td>
            <td title="${escapeHtml(r.TRECHO)}">${escapeHtml(r.TRECHO)}</td>
            <td>${escapeHtml(r['DATA PROTOCOLO'])}</td>
            <td title="${escapeHtml(r['AGENTE DA SUPERVISÃO'])}">${escapeHtml(r['AGENTE DA SUPERVISÃO'])}</td>
            <td title="${escapeHtml(r['ETAPA ATUAL DO PROCESSO'])}">${escapeHtml(r['ETAPA ATUAL DO PROCESSO'])}</td>
            <td title="${escapeHtml(r.COMUNICAÇÃO)}">${escapeHtml(r.COMUNICAÇÃO_STATUS)}</td>
            <td title="${escapeHtml(r.QUALIDADE)}">${escapeHtml(r.QUALIDADE_STATUS)}</td>
            <td title="${escapeHtml(r.SST)}">${escapeHtml(r.SST_STATUS)}</td>
            <td title="${escapeHtml(r.SUPERVISÃO)}">${escapeHtml(r.SUPERVISÃO_STATUS)}</td>
            <td title="${escapeHtml(r['PENDÊNCIAS'])}">${escapeHtml(r.PENDENCIA_DOCUMENTAL)}</td>
            <td>${mapa}</td>
        </tr>`;
    }).join('');
}
function initMapa(){
    if (!window.L || accMapa) return;
    accMapa = L.map('accMapa', { zoomControl:true }).setView([-23.44, -46.48], 10);
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20, attribution:'Google' }).addTo(accMapa);
    accLayer = L.layerGroup().addTo(accMapa);
    setTimeout(()=>accMapa.invalidateSize(true),300);
}
async function carregarCamadasMapa(){
    try {
        const resp = await fetch('MAPA/index.html?v=' + Date.now());
        if (!resp.ok) return;
        const html = await resp.text();
        const scripts = [];
        const re = /<script[^>]+src=["']([^"']*layers\/[^"']+\.js)["']/gi;
        let m;
        while ((m = re.exec(html))) {
            let src = m[1];
            if (src.startsWith('layers/')) src = 'MAPA/' + src;
            if (!scripts.includes(src)) scripts.push(src);
        }
        await Promise.all(scripts.map(src => new Promise(resolve => {
            const s = document.createElement('script');
            s.src = src + '?v=' + Date.now();
            s.onload = resolve; s.onerror = resolve;
            document.head.appendChild(s);
        })));
    } catch(e) { console.warn('Não foi possível carregar camadas do mapa para ACC.', e); }
    montarIndiceFeatures();
}
function achatarCoords(coords, out=[]){
    if (!Array.isArray(coords)) return out;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') { out.push(coords); return out; }
    coords.forEach(c => achatarCoords(c,out));
    return out;
}
function centroGeom(geom){
    if (!geom || !geom.coordinates) return null;
    const pts = achatarCoords(geom.coordinates, []);
    const bons = pts.filter(p => Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])));
    if (!bons.length) return null;
    const lon = bons.reduce((s,p)=>s+Number(p[0]),0)/bons.length;
    const lat = bons.reduce((s,p)=>s+Number(p[1]),0)/bons.length;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return {lat, lon};
}
function montarIndiceFeatures(){
    accFeatureIndex = [];
    Object.keys(window).forEach(k => {
        if (!/^json_/i.test(k)) return;
        const fc = window[k];
        if (!fc || !Array.isArray(fc.features)) return;
        fc.features.forEach(feat => {
            const p = feat.properties || {};
            const frente = p.FRENTE || p.Frente || p.NOME_FRENTE || p.OBRA || p.ID || '';
            const contrato = normalizarContrato(p.NUM_CONTRA || p.CONTRATO || p.Contrato || p.NUMERO_CONTRATO || '');
            const centro = centroGeom(feat.geometry);
            if (!centro) return;
            accFeatureIndex.push({ frente: normalizar(frente), contrato, props:p, lat:centro.lat, lon:centro.lon, varName:k });
        });
    });
}
function localizarFluxo(r){
    const frente = normalizar(r.FRENTE);
    const contrato = normalizarContrato(r.CONTRATO);
    if (!frente && !contrato) return null;
    let cand = accFeatureIndex.filter(f => (!contrato || f.contrato === contrato));
    if (frente) {
        let exata = cand.find(f => f.frente === frente);
        if (exata) return exata;
        let parcial = cand.find(f => f.frente && (f.frente.includes(frente) || frente.includes(f.frente)));
        if (parcial) return parcial;
    }
    return null;
}
function criarUrlMapa(r, loc){
    const params = new URLSearchParams();
    params.set('ponteLat', loc.lat.toFixed(7));
    params.set('ponteLon', loc.lon.toFixed(7));
    params.set('ponteZoom', '18');
    params.set('ponteValor', r.FRENTE || r['N° DO FLUXO ACC'] || 'ACC');
    return 'index.html?' + params.toString();
}
function atualizarMapa(){
    initMapa();
    if (!accMapa || !accLayer) return;
    accLayer.clearLayers();
    const bounds = [];
    let localizados = 0;
    accFiltrados.forEach(r => {
        const loc = localizarFluxo(r);
        if (!loc) return;
        localizados++;
        const cor = corStatus(r.SITUACAO_GERAL);
        const marker = L.circleMarker([loc.lat, loc.lon], { radius:8, color:'#111827', weight:1.5, fillColor:cor, fillOpacity:.92 });
        marker.bindPopup(`<strong>${escapeHtml(r['N° DO FLUXO ACC'])}</strong><br>${escapeHtml(r.CONTRATO)}<br>${escapeHtml(r.FRENTE)}<br><b>${escapeHtml(r.SITUACAO_GERAL)}</b><br><a href="${criarUrlMapa(r, loc)}" target="_blank">Abrir no mapa principal</a>`);
        marker.addTo(accLayer);
        bounds.push([loc.lat, loc.lon]);
    });
    setText('accMapaResumo', `${fmt(localizados)} localizados`);
    if (bounds.length) accMapa.fitBounds(bounds, { padding:[20,20], maxZoom:15 });
    else accMapa.setView([-23.44, -46.48], 10);
}
function atualizarACC(){
    accFiltrados = obterFiltrados();
    atualizarCards(); atualizarGraficos(); atualizarProcessos(); atualizarTabela(); atualizarMapa();
}
function exportarAccCsv(){
    const cols = ['N°','CONTRATO','N° DO FLUXO ACC','SITUACAO_GERAL','ABERTO/FECHADO','TIPO','FRENTE','TRECHO','ENDEREÇO','DATA PROTOCOLO','AGENTE DA SUPERVISÃO','ETAPA ATUAL DO PROCESSO','COMUNICAÇÃO','QUALIDADE','SST','SUPERVISÃO','PENDÊNCIAS','CHECKLIST_DOCUMENTAL','FLUXO_CORRELACIONADO'];
    const linhas = [cols.join(';')].concat(accFiltrados.map(r => cols.map(c => '"' + String(r[c] || '').replace(/"/g,'""') + '"').join(';')));
    const blob = new Blob([linhas.join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'acc_fluxos_filtrados.csv'; a.click(); URL.revokeObjectURL(a.href);
}
async function exportarAccPdf(){
    if (!window.html2canvas || !window.jspdf) { window.print(); return; }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','mm','a4');
    const alvo = document.getElementById('dashboard');
    const canvas = await html2canvas(alvo, { scale: 1.4, useCORS: true, backgroundColor: '#f3f5f7' });
    const img = canvas.toDataURL('image/png');
    const pageW = 210, pageH = 297, margin = 8;
    const imgW = pageW - margin*2;
    const imgH = canvas.height * imgW / canvas.width;
    let y = 0;
    while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(img, 'PNG', margin, margin - y, imgW, imgH);
        y += pageH - margin*2;
    }
    pdf.save('ponte_acc.pdf');
}
window.fecharModal = function(){ const m=document.getElementById('modal'); if(m)m.style.display='none'; };
function abrirModal(titulo, html){ setText('modalTitulo', titulo); const c=document.getElementById('modalCorpo'); if(c)c.innerHTML=html; const m=document.getElementById('modal'); if(m)m.style.display='flex'; }
function initCardsClick(){
    document.querySelectorAll('[data-acc-card]').forEach(card => {
        card.addEventListener('click', () => {
            const tipo = card.getAttribute('data-acc-card');
            let arr = accFiltrados;
            if (tipo === 'sem') arr = arr.filter(r=>r.SITUACAO_GERAL==='Sem objeção');
            if (tipo === 'com') arr = arr.filter(r=>r.SITUACAO_GERAL==='Com objeção');
            if (tipo === 'analise') arr = arr.filter(r=>r.SITUACAO_GERAL==='Em análise');
            if (tipo === 'abertos') arr = arr.filter(r=>normalizar(r['ABERTO/FECHADO'])==='ABERTO');
            if (tipo === 'pendencia') arr = arr.filter(r=>r.PENDENCIA_DOCUMENTAL==='Sim');
            const porTipo = Object.entries(contar(arr,'TIPO')).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="acc-kpi-mini"><strong>${fmt(v)}</strong><span>${escapeHtml(k)}</span></div>`).join('');
            abrirModal(card.querySelector('h3')?.textContent || 'Detalhe ACC', `<div class="acc-modal-grid">${porTipo || '<p>Sem registros no recorte.</p>'}</div>`);
        });
    });
}
async function iniciar(){
    accFluxos = await carregarCsv('dados/acc_fluxos.csv');
    accProcessos = await carregarCsv('dados/acc_processos_gas.csv');
    setText('accAtualizacao', `Base ACC: ${fmt(accFluxos.length)} fluxos | ${fmt(accProcessos.length)} linhas em Processos Gás`);
    initFiltros(); initCardsClick(); initMapa();
    await carregarCamadasMapa();
    atualizarACC();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

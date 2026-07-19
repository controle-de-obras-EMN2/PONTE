/* PONTE - Dashboard estável
   Refeito para a exportação atual do qgis2web.
   Camadas esperadas: OBRAS_EMN2_4, FRENTES_9, SinistroEMN2_7, PONTOSDELANAMENTO_8, EEE_6.
*/

console.log("dashboard.js PONTE estável carregado - 2026-07-17");

let contratoSelecionado = "TODOS";
let graficoStatusObras = null;
let graficoMetodo = null;
let graficoDiametro = null;
let graficoMaterial = null;
let graficoFrentesStatus = null;
let graficoEEEStatus = null;
let graficoManchas = null;
let graficoValores = null;
let graficoExtensao = null;
let graficoMatrizRisco = null;
let graficoMatrizStatus = null;
let graficoMatrizInterferencias = null;
let graficoMatrizMetodos = null;
let matrizRiscoInicializada = false;
let matrizMapaOL = null;
let matrizFonteOL = null;
let matrizLayerPontosOL = null;

let ponteModalCols = [];
let ponteModalRows = [];

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarNumero(valor) {
    const n = Number(valor || 0);
    return n.toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
    const n = Number(valor || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentual(realizado, previsto) {
    const r = Number(realizado || 0);
    const p = Number(previsto || 0);
    return p ? (r / p) * 100 : 0;
}

function valorCampo(props, campos) {
    for (const campo of campos) {
        if (props && props[campo] !== undefined && props[campo] !== null && String(props[campo]).trim() !== "") {
            return props[campo];
        }
    }
    return "";
}

function textoCampo(props, campos) {
    const v = valorCampo(props, campos);
    return String(v ?? "").trim();
}

function obterFeaturesPorVariavel(nomeVariavel) {
    const camada = window[nomeVariavel];
    return camada && Array.isArray(camada.features) ? camada.features : [];
}

function obterFeaturesPorNomeParcial(partes) {
    const termos = (Array.isArray(partes) ? partes : [partes]).map(normalizarTexto);
    let features = [];

    Object.keys(window).forEach(chave => {
        if (!chave.startsWith("json_")) return;
        const nomeNorm = normalizarTexto(chave);
        if (!termos.some(t => nomeNorm.includes(t))) return;
        const camada = window[chave];
        if (camada && Array.isArray(camada.features)) {
            features = features.concat(camada.features);
        }
    });

    return features;
}

function obterObras() {
    const direto = obterFeaturesPorVariavel("json_OBRAS_EMN2_4");
    if (direto.length) return direto;
    return obterFeaturesPorNomeParcial(["OBRAS_EMN2", "OBRAS"]);
}

function obterFrentesCampo() {
    const direto = obterFeaturesPorVariavel("json_FRENTES_9");
    if (direto.length) return direto;

    const porNome = obterFeaturesPorNomeParcial(["FRENTES", "FRENTEEMANDAMENTO", "FRENTE_EM_ANDAMENTO"]);
    if (porNome.length) return porNome;

    return obterFeaturesPorNomeParcial(["json_"]).filter(f => {
        const p = f.properties || {};
        return p["AJUSTE STA"] !== undefined || p.GAS !== undefined || p.RISCO !== undefined || p.SOMA !== undefined;
    });
}

function obterSinistros() {
    const direto = obterFeaturesPorVariavel("json_SinistroEMN2_7");
    if (direto.length) return direto;
    return obterFeaturesPorNomeParcial(["Sinistro", "SINISTRO"]);
}

function obterLancamentos() {
    const direto = obterFeaturesPorVariavel("json_PONTOSDELANAMENTO_8");
    if (direto.length) return direto;
    return obterFeaturesPorNomeParcial(["PONTOSDELAN", "LANAMENTO", "LANCAMENTO"]);
}

function obterEEE() {
    const direto = obterFeaturesPorVariavel("json_EEE_6");
    if (direto.length) return direto;
    return obterFeaturesPorNomeParcial(["EEE"])
        .filter(f => {
            const p = f.properties || {};
            return p.EEE !== undefined || p.Q !== undefined || p.OPERAÇÃO !== undefined || p["ENDEREÇO"] !== undefined;
        });
}

function obterManchas() {
    const direto = obterFeaturesPorVariavel("json_VIRADADEMANCHA_2");
    if (direto.length) return direto;
    return obterFeaturesPorNomeParcial(["VIRADADEMANCHA", "MANCHA"]);
}

function contratoDaFeature(feature) {
    const p = feature.properties || {};
    return String(valorCampo(p, ["NUM_CONTRA", "NUM_CONTRATO", "CONTRATO", "Contrato", "contrato", "Pacote"]) || "").trim();
}

function filtrarPorContrato(features) {
    if (!Array.isArray(features)) return [];
    if (!contratoSelecionado || contratoSelecionado === "TODOS") return features;
    return features.filter(feature => contratoDaFeature(feature) === contratoSelecionado);
}

function statusLancamentoResumo(features) {
    const resumo = { total: features.length, ativos: 0, suprimidos: 0 };
    features.forEach(f => {
        const p = f.properties || {};
        const status = normalizarTexto(p.Status || p.STATUS || p.status);
        if (["SUPRIMIDO", "ELIMINADO", "INATIVO"].some(s => status.includes(s))) {
            resumo.suprimidos++;
        } else if (status) {
            resumo.ativos++;
        }
    });
    return resumo;
}

function itemObraUnica(feature) {
    const p = feature.properties || {};
    const contrato = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
    const frente = textoCampo(p, ["FRENTE", "Frente", "frente"]);
    const chave = contrato + "|" + (frente || textoCampo(p, ["NUM_BP", "fid", "id"]) || JSON.stringify(feature.geometry || {}));

    return {
        chave,
        contrato,
        frente: frente || "Não informado",
        status: textoCampo(p, ["STATUS_C", "STATUS", "Status"]) || "Não informado",
        metodo: textoCampo(p, ["METODO", "Metod_Cons", "Método"]) || "Não informado",
        diametro: textoCampo(p, ["DIAMETR_MM", "DIAMETRO", "Diâmetro"]) || "Não informado",
        material: textoCampo(p, ["MATERIAL", "Material", "TIPO"]) || "Não informado",
        municipio: textoCampo(p, ["MUNICIPIO", "Município"]),
        bairro: textoCampo(p, ["BAIRRO", "Bairro"]),
        logradouro: textoCampo(p, ["LOGRADOURO", "Logradouro"])
    };
}

function agruparObrasUnicas(features) {
    const mapa = new Map();
    features.forEach(feature => {
        const item = itemObraUnica(feature);
        if (!mapa.has(item.chave)) mapa.set(item.chave, item);
    });
    return Array.from(mapa.values());
}

function contarPorCampo(features, campo) {
    const r = {};
    features.forEach(f => {
        const p = f.properties || {};
        const valor = String(p[campo] ?? "Não informado").trim() || "Não informado";
        r[valor] = (r[valor] || 0) + 1;
    });
    return r;
}

function contarPorArray(items, campo) {
    const r = {};
    items.forEach(item => {
        const valor = String(item[campo] ?? "Não informado").trim() || "Não informado";
        r[valor] = (r[valor] || 0) + 1;
    });
    return r;
}

function destruirGrafico(grafico) {
    if (grafico && typeof grafico.destroy === "function") grafico.destroy();
}

function criarGraficoBarra(idCanvas, titulo, dados, graficoAnterior) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas || typeof Chart === "undefined") return graficoAnterior;

    destruirGrafico(graficoAnterior);

    const labels = Object.keys(dados || {});
    const valores = Object.values(dados || {});

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{ label: titulo, data: valores }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 20 } },
                y: { beginAtZero: true }
            }
        }
    });
}

function criarGraficoPizza(idCanvas, titulo, dados, graficoAnterior) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas || typeof Chart === "undefined") return graficoAnterior;
    destruirGrafico(graficoAnterior);
    return new Chart(canvas, {
        type: "pie",
        data: { labels: Object.keys(dados || {}), datasets: [{ label: titulo, data: Object.values(dados || {}) }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function atualizarMetas() {
    if (typeof metas === "undefined") return;

    const ecoFU = metas.economias?.fatorU || { previsto: 0, realizado: 0 };
    const ecoCT = metas.economias?.contrato || { previsto: 0, realizado: 0 };
    const imob = metas.imobilizado || { previsto: 0, realizado: 0 };
    const prodI = metas.producao?.integra || { previsto: 0, realizado: 0 };
    const prodA = metas.producao?.andamento || { previsto: 0, realizado: 0 };

    setTexto("ecoFatorUReal", formatarNumero(ecoFU.realizado));
    setTexto("ecoFatorUPerc", percentual(ecoFU.realizado, ecoFU.previsto).toFixed(2) + "%");
    setTexto("ecoFatorUMeta", "Meta: " + formatarNumero(ecoFU.previsto));

    setTexto("ecoContratoReal", formatarNumero(ecoCT.realizado));
    setTexto("ecoContratoPerc", percentual(ecoCT.realizado, ecoCT.previsto).toFixed(2) + "%");
    setTexto("ecoContratoMeta", "Meta: " + formatarNumero(ecoCT.previsto));

    setTexto("imobReal", formatarMoeda(imob.realizado));
    setTexto("imobPerc", percentual(imob.realizado, imob.previsto).toFixed(2) + "%");
    setTexto("imobMeta", "Meta: " + formatarMoeda(imob.previsto));

    setTexto("prodIntegraReal", formatarNumero(prodI.realizado) + " m");
    setTexto("prodIntegraPerc", percentual(prodI.realizado, prodI.previsto).toFixed(2) + "%");
    setTexto("prodIntegraMeta", "Meta: " + formatarNumero(prodI.previsto) + " m");

    setTexto("prodAndamentoReal", formatarNumero(prodA.realizado) + " m");
    setTexto("prodAndamentoPerc", percentual(prodA.realizado, prodA.previsto).toFixed(2) + "%");
    setTexto("prodAndamentoMeta", "Meta: " + formatarNumero(prodA.previsto) + " m");
}

function setTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.innerText = texto;
}

function atualizarDashboard() {
    const obras = filtrarPorContrato(obterObras());
    const frentesCampo = filtrarPorContrato(obterFrentesCampo().filter(f => !ehStatusConcluidoMatriz(f.properties || {})));
    const sinistros = filtrarPorContrato(obterSinistros());
    const eee = filtrarPorContrato(obterEEE());
    const lancamentos = filtrarPorContrato(obterLancamentos());
    const manchas = obterManchas();

    const obrasUnicas = agruparObrasUnicas(obras);
    const statusProntos = [
        "OBRA CONCLUIDA",
        "PAVIMENTACAO PROVISORIA CONCLUIDA",
        "PAVIMENTACAO DEFINITIVA CONCLUIDA",
        "IMOBILIZADO"
    ];
    const prontas = obrasUnicas.filter(o => statusProntos.includes(normalizarTexto(o.status))).length;
    const percProntas = obrasUnicas.length ? percentual(prontas, obrasUnicas.length) : 0;

    setTexto("totalObras", formatarNumero(obrasUnicas.length));
    setTexto("percentualObrasProntas", percProntas.toFixed(1) + "% prontas");
    setTexto("totalFrentes", formatarNumero(frentesCampo.length));
    setTexto("totalSinistros", formatarNumero(sinistros.length));
    setTexto("totalEEE", formatarNumero(eee.length));

    const lancResumo = statusLancamentoResumo(lancamentos);
    setTexto("totalLancamentos", formatarNumero(lancResumo.total));
    setTexto("statusLancamentos", "Ativos: " + formatarNumero(lancResumo.ativos) + " | Suprimidos: " + formatarNumero(lancResumo.suprimidos));

    graficoStatusObras = criarGraficoBarra("graficoStatusObras", "Obras por Status", contarPorArray(obrasUnicas, "status"), graficoStatusObras);
    graficoMetodo = criarGraficoBarra("graficoMetodo", "Obras por Método", contarPorArray(obrasUnicas, "metodo"), graficoMetodo);
    graficoDiametro = criarGraficoBarra("graficoDiametro", "Obras por Diâmetro", contarPorArray(obrasUnicas, "diametro"), graficoDiametro);
    graficoMaterial = criarGraficoBarra("graficoMaterial", "Obras por Material", contarPorArray(obrasUnicas, "material"), graficoMaterial);
    graficoFrentesStatus = criarGraficoBarra("graficoFrentesStatus", "Frentes por Status", contarPorCampo(frentesCampo, "AJUSTE STA"), graficoFrentesStatus);
    graficoEEEStatus = criarGraficoBarra("graficoEEEStatus", "EEE por Status", contarPorCampo(eee, "STATUS"), graficoEEEStatus);
    graficoManchas = criarGraficoBarra("graficoManchas", "Manchas por Cor", contarPorCampo(manchas, "COR_MANCHA"), graficoManchas);

    atualizarGraficosContratos();
}

function atualizarGraficosContratos() {
    if (typeof metas === "undefined") return;

    const filtrarLinhaContrato = linha => contratoSelecionado === "TODOS" || linha.contrato === contratoSelecionado;

    const valores = (metas.valoresContratos || []).filter(filtrarLinhaContrato);
    const labels = valores.map(v => v.contrato);
    const canvasValores = document.getElementById("graficoValores");
    if (canvasValores && typeof Chart !== "undefined") {
        destruirGrafico(graficoValores);
        graficoValores = new Chart(canvasValores, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    { label: "Valor contratual", data: valores.map(v => v.valorContratual || 0) },
                    { label: "Total pedido", data: valores.map(v => v.totalPedido || 0) },
                    { label: "Total unitizado", data: valores.map(v => v.totalUnitizado || 0) }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }

    const exts = (metas.extensaoContratos || []).filter(filtrarLinhaContrato);
    const labelsExt = exts.map(v => v.contrato);
    const canvasExt = document.getElementById("graficoExtensao");
    if (canvasExt && typeof Chart !== "undefined") {
        destruirGrafico(graficoExtensao);
        graficoExtensao = new Chart(canvasExt, {
            type: "bar",
            data: {
                labels: labelsExt,
                datasets: [
                    { label: "Contratual", data: exts.map(v => v.contratual || 0) },
                    { label: "Atual", data: exts.map(v => v.atual || 0) },
                    { label: "Executada", data: exts.map(v => v.executada || 0) },
                    { label: "Unitizada", data: exts.map(v => v.unitizada || 0) }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
}

window.filtrarContrato = function(contrato) {
    contratoSelecionado = contrato || "TODOS";
    atualizarBotaoContratoAtivo();
    atualizarDashboard();
    sincronizarFiltroMatrizContrato(contratoSelecionado);
    atualizarMatrizRisco();
};

function atualizarBotaoContratoAtivo() {
    document.querySelectorAll(".filtros-dashboard button").forEach(btn => {
        const texto = btn.innerText.trim();
        const ativo = (contratoSelecionado === "TODOS" && normalizarTexto(texto) === "TODOS") || texto === contratoSelecionado;
        btn.classList.toggle("ativo", ativo);
    });
}

function abrirModal(titulo, html) {
    const modal = document.getElementById("modal");
    const tituloEl = document.getElementById("modalTitulo");
    const corpo = document.getElementById("modalCorpo");
    if (!modal || !tituloEl || !corpo) return;
    tituloEl.innerText = titulo;
    corpo.innerHTML = html;
    modal.style.display = "block";
}

window.fecharModal = function() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
};

window.addEventListener("click", function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) window.fecharModal();
});

function botaoExportacaoModal() {
    return `
        <div class="modal-export-toolbar">
            <button type="button" onclick="exportarModalCSV()">Exportar CSV</button>
            <button type="button" onclick="exportarModalPDF()">Exportar PDF</button>
        </div>
    `;
}

function gerarTabelaGenerica(features, colunas, opcoes = {}) {
    const linhas = features.map(feature => {
        const p = feature.properties || {};
        return colunas.map(c => typeof c.valor === "function" ? c.valor(p, feature) : (p[c.campo] ?? ""));
    });

    ponteModalCols = colunas.map(c => c.titulo);
    ponteModalRows = linhas;

    let html = botaoExportacaoModal();
    if (!features.length) return html + "<p>Nenhum registro encontrado para o filtro atual.</p>";

    html += "<table class='tabela-modal tabela-compacta'><thead><tr>";
    colunas.forEach(c => html += `<th>${escaparHtml(c.titulo)}</th>`);
    if (opcoes.verNoMapa) html += "<th>Mapa</th>";
    html += "</tr></thead><tbody>";

    features.forEach((feature, idx) => {
        const p = feature.properties || {};
        html += "<tr>";
        colunas.forEach(c => {
            const valor = typeof c.valor === "function" ? c.valor(p, feature) : (p[c.campo] ?? "");
            const cls = c.classe || "";
            const title = c.titleCompleto ? c.titleCompleto(p, feature) : valor;
            html += `<td class="${cls}" title="${escaparHtml(title)}">${escaparHtml(valor)}</td>`;
        });
        if (opcoes.verNoMapa) {
            const campo = opcoes.campoBusca || "FRENTE";
            const valorBusca = p[campo] || p.FRENTE || p.ID || "";
            if (valorBusca) {
                html += `<td><a class="link-ver-mapa" target="_blank" href="${criarUrlVerNoMapa(opcoes.layer || "", campo, valorBusca)}">Ver</a></td>`;
            } else {
                html += "<td><span class='link-ver-mapa-indisponivel'>Sem ref.</span></td>";
            }
        }
        html += "</tr>";
    });

    html += "</tbody></table>";
    return html;
}

function criarUrlVerNoMapa(layer, campo, valor) {
    const params = new URLSearchParams();
    params.set("ponteLayer", layer || "");
    params.set("ponteCampo", campo || "");
    params.set("ponteValor", String(valor || ""));
    return "index.html?" + params.toString();
}

function enderecoCurto(valor) {
    const texto = String(valor || "").replace(/\s+/g, " ").trim();
    if (!texto) return "";
    const partes = texto.split(",").map(p => p.trim()).filter(Boolean);
    const reduzido = partes.slice(0, 2).join(", ") || texto;
    return reduzido.length > 55 ? reduzido.slice(0, 52) + "..." : reduzido;
}

function simNao(valor) {
    if (valor === undefined || valor === null || String(valor).trim() === "") return "Não";
    const n = Number(String(valor).replace(",", "."));
    if (!Number.isNaN(n)) return n > 0 ? "Sim" : "Não";
    return normalizarTexto(valor) === "NULL" ? "Não" : String(valor);
}

function metodosFrente(p) {
    const metodos = [];
    if (simNao(p.VCA) === "Sim") metodos.push("VCA");
    if (simNao(p.HDD) === "Sim") metodos.push("HDD");
    if (simNao(p.OUTROS_MND) === "Sim") metodos.push("Outros MND");
    return metodos.join(" + ") || "";
}

function profundidadeFrente(p) {
    const profs = [];
    if (simNao(p["<1,25M"]) === "Sim") profs.push("< 1,25 m");
    if (simNao(p["ATÉ 4,00"]) === "Sim") profs.push("Até 4,00 m");
    if (simNao(p["> 4,00 M"]) === "Sim") profs.push("> 4,00 m");
    return profs.join(" + ") || "";
}

window.abrirDetalhesFrentes = function() {
    const frentes = filtrarPorContrato(obterFrentesCampo());
    const colunas = [
        { titulo: "Contrato", valor: p => p.NUM_CONTRA || p.CONTRATO || p.Contrato || "", classe: "col-curta" },
        { titulo: "ID", valor: p => p.ID || p.FRENTE || "", classe: "col-curta" },
        { titulo: "Status", valor: p => p["AJUSTE STA"] || p.STATUS || "", classe: "col-media" },
        { titulo: "Etapa", valor: p => p.ETAPA || "", classe: "col-media" },
        { titulo: "Risco", valor: p => p.RISCO || "", classe: "col-media" },
        { titulo: "Métodos", valor: metodosFrente, classe: "col-media" },
        { titulo: "Profundidade", valor: profundidadeFrente, classe: "col-media" },
        { titulo: "Gás", valor: p => simNao(p.GAS), classe: "col-curta" },
        { titulo: "Elétrica", valor: p => simNao(p.ELETRICIDA), classe: "col-curta" },
        { titulo: "Telecom", valor: p => simNao(p.TELECON), classe: "col-curta" },
        { titulo: "Drenagem", valor: p => simNao(p.DRENAGEM), classe: "col-curta" },
        { titulo: "Soma", valor: p => p.SOMA || "", classe: "col-curta" },
        { titulo: "Endereço", valor: p => enderecoCurto(p.ENDERECO_C || p.ENDEREÇO || ""), titleCompleto: p => p.ENDERECO_C || p.ENDEREÇO || "", classe: "col-endereco" },
        { titulo: "Data início", valor: p => p.DT_INICIO || "", classe: "col-curta" },
        { titulo: "Data término", valor: p => p["DT TERMINO"] || p.DT_TERMINO || "", classe: "col-curta" }
    ];
    abrirModal("Frentes em Campo", gerarTabelaGenerica(frentes, colunas, { verNoMapa: true, layer: "FRENTES", campoBusca: "ID" }));
};

window.abrirDetalhesObras = function() {
    const obras = filtrarPorContrato(obterObras());
    const unicas = agruparObrasUnicas(obras);
    ponteModalCols = ["Contrato", "Frente", "Status", "Método", "Diâmetro", "Material", "Município", "Bairro", "Logradouro"];
    ponteModalRows = unicas.map(o => [o.contrato, o.frente, o.status, o.metodo, o.diametro, o.material, o.municipio, o.bairro, o.logradouro]);

    let html = botaoExportacaoModal();
    html += "<table class='tabela-modal tabela-compacta'><thead><tr>" + ponteModalCols.map(c => `<th>${escaparHtml(c)}</th>`).join("") + "<th>Mapa</th></tr></thead><tbody>";
    unicas.forEach(o => {
        html += "<tr>";
        [o.contrato, o.frente, o.status, o.metodo, o.diametro, o.material, o.municipio, o.bairro, o.logradouro].forEach(v => {
            html += `<td>${escaparHtml(v)}</td>`;
        });
        html += `<td><a class="link-ver-mapa" target="_blank" href="${criarUrlVerNoMapa("OBRAS", "FRENTE", o.frente)}">Ver</a></td>`;
        html += "</tr>";
    });
    html += "</tbody></table>";
    abrirModal("Obras cadastradas", html);
};

window.abrirDetalhesSinistros = function() {
    const sinistros = filtrarPorContrato(obterSinistros());
    abrirModal("Sinistros", gerarTabelaGenerica(sinistros, [
        { titulo: "Contrato", campo: "Contrato" },
        { titulo: "Ficha", campo: "Ficha" },
        { titulo: "Nome", campo: "Nome" },
        { titulo: "Endereço", campo: "Endereço", classe: "col-endereco" },
        { titulo: "Frente", campo: "Frente" },
        { titulo: "Sinistro", campo: "Sinistro" },
        { titulo: "Critério", campo: "Critério" }
    ], { verNoMapa: true, layer: "Sinistro", campoBusca: "Ficha" }));
};

window.abrirDetalhesEEE = function() {
    const eee = filtrarPorContrato(obterEEE());
    abrirModal("Elevatórias - EEE", gerarTabelaGenerica(eee, [
        { titulo: "Contrato", campo: "CONTRATO" },
        { titulo: "EEE", campo: "EEE" },
        { titulo: "Vazão Q", campo: "Q" },
        { titulo: "Status", campo: "STATUS" },
        { titulo: "Local", campo: "LOCAL" },
        { titulo: "Endereço", campo: "ENDEREÇO", classe: "col-endereco" },
        { titulo: "Município", campo: "MUNICIPIO" },
        { titulo: "Operação", campo: "OPERAÇÃO" }
    ], { verNoMapa: true, layer: "EEE", campoBusca: "EEE" }));
};

window.abrirDetalhesLancamentos = function() {
    const lancamentos = filtrarPorContrato(obterLancamentos());
    abrirModal("Pontos de Lançamento", gerarTabelaGenerica(lancamentos, [
        { titulo: "Contrato", campo: "Contrato" },
        { titulo: "Nome", campo: "Nome_Lanca" },
        { titulo: "Subdivisão", campo: "Subdivisao" },
        { titulo: "Unidade", campo: "Unidade_Ne" },
        { titulo: "Município", campo: "Municipio" },
        { titulo: "Bacia", campo: "Bacia" },
        { titulo: "Pacote", campo: "Pacote" },
        { titulo: "Status", campo: "Status" }
    ], { verNoMapa: true, layer: "PONTOSDELANAMENTO", campoBusca: "Nome_Lanca" }));
};

function ativarCliquesDosCards() {
    const mapa = {
        cardObras: window.abrirDetalhesObras,
        cardFrentes: window.abrirDetalhesFrentes,
        cardSinistros: window.abrirDetalhesSinistros,
        cardEEE: window.abrirDetalhesEEE,
        cardLancamentos: window.abrirDetalhesLancamentos
    };
    Object.entries(mapa).forEach(([id, fn]) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    });
}

window.exportarModalCSV = function() {
    const linhas = [ponteModalCols, ...ponteModalRows];
    const csv = linhas.map(linha => linha.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo("ponte_modal.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
};

window.exportarModalPDF = async function() {
    const corpo = document.getElementById("modalCorpo");
    if (!corpo || typeof html2canvas === "undefined" || !window.jspdf) {
        window.print();
        return;
    }
    const canvas = await html2canvas(corpo, { scale: 1.5, useCORS: true });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 16;
    const imgH = canvas.height * imgW / canvas.width;
    pdf.text(document.getElementById("modalTitulo")?.innerText || "PONTE", 8, 8);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 8, 14, imgW, Math.min(imgH, pageH - 20));
    pdf.save("ponte_modal.pdf");
};

function baixarArquivo(nome, tipo, conteudo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportarResumoCSV() {
    const linhas = [
        ["Indicador", "Valor", "Detalhe"],
        ["Obras cadastradas", document.getElementById("totalObras")?.innerText || "", document.getElementById("percentualObrasProntas")?.innerText || ""],
        ["Frentes em campo", document.getElementById("totalFrentes")?.innerText || "", ""],
        ["Sinistros", document.getElementById("totalSinistros")?.innerText || "", ""],
        ["EEE", document.getElementById("totalEEE")?.innerText || "", ""],
        ["Pontos de lançamento", document.getElementById("totalLancamentos")?.innerText || "", document.getElementById("statusLancamentos")?.innerText || ""]
    ];
    const csv = linhas.map(linha => linha.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo("ponte_resumo_dashboard.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
}

async function exportarDashboardPDF() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard || typeof html2canvas === "undefined" || !window.jspdf) {
        window.print();
        return;
    }
    const canvas = await html2canvas(dashboard, { scale: 1.2, useCORS: true });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW - 16;
    const imgH = canvas.height * imgW / canvas.width;
    pdf.setFont("helvetica", "bold");
    pdf.text("PONTE - Dashboard", 8, 8);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 8, 14, imgW, Math.min(imgH, pageH - 20));
    pdf.save("ponte_dashboard.pdf");
}


/* =========================
   MATRIZ DE RISCO
========================= */

function numeroSeguro(valor) {
    if (valor === undefined || valor === null || valor === "") return 0;
    let texto = String(valor).trim();
    if (texto.includes(",") && texto.includes(".")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
        texto = texto.replace(",", ".");
    }
    const n = Number(texto);
    return Number.isFinite(n) ? n : 0;
}

function valorSimNaoNormalizado(valor) {
    return simNao(valor) === "Sim" ? "SIM" : "NAO";
}

function statusFrenteMatriz(p) {
    return textoCampo(p, ["AJUSTE STA", "STATUS", "Status"]) || "Não informado";
}

function ehStatusConcluidoMatriz(statusOuProps) {
    const status = typeof statusOuProps === "object" && statusOuProps !== null
        ? statusFrenteMatriz(statusOuProps)
        : statusOuProps;
    const n = normalizarTexto(status);
    return n.includes("CONCLUID");
}

function frentesMatrizVisiveisBase() {
    return obterFrentesCampo().filter(f => !ehStatusConcluidoMatriz(f.properties || {}));
}

function riscoFrenteMatriz(p) {
    return textoCampo(p, ["RISCO", "Risco", "risco"]) || "Não informado";
}

function listaMetodosFrente(p) {
    const metodos = [];
    if (simNao(p.VCA) === "Sim") metodos.push("VCA");
    if (simNao(p.HDD) === "Sim") metodos.push("HDD");
    if (simNao(p.OUTROS_MND) === "Sim") metodos.push("Outros MND");
    if (!metodos.length && p.METODO) metodos.push(String(p.METODO));
    return metodos;
}

function obterValorFiltroMatriz(id) {
    return document.getElementById(id)?.value || "TODOS";
}

function coordenadaFrente(feature) {
    const p = feature.properties || {};
    let lon = numeroSeguro(p.Longitude ?? p.LONGITUDE ?? p.lon ?? p.LON);
    let lat = numeroSeguro(p.Latitude ?? p.LATITUDE ?? p.lat ?? p.LAT);

    if ((!lon || !lat) && feature.geometry && Array.isArray(feature.geometry.coordinates)) {
        const coords = feature.geometry.coordinates;
        if (typeof coords[0] === "number" && typeof coords[1] === "number") {
            lon = coords[0];
            lat = coords[1];
        } else if (Array.isArray(coords[0]) && typeof coords[0][0] === "number") {
            lon = coords[0][0];
            lat = coords[0][1];
        }
    }

    if (!lon || !lat) return null;
    return { lon, lat };
}

function corRiscoMatriz(risco) {
    const r = normalizarTexto(risco);
    if (r.includes("ALTO")) return "#d93618";
    if (r.includes("MEDIO") || r.includes("MÉDIO")) return "#f2b705";
    if (r.includes("BAIXO")) return "#2fa84f";
    return "#0b6fb3";
}

function filtrarMatrizRiscoBase(incluirConcluidas = false) {
    const contrato = obterValorFiltroMatriz("matrizFiltroContrato");
    const risco = obterValorFiltroMatriz("matrizFiltroRisco");
    const status = obterValorFiltroMatriz("matrizFiltroStatus");
    const metodo = obterValorFiltroMatriz("matrizFiltroMetodo");
    const gas = obterValorFiltroMatriz("matrizFiltroGas");
    const eletrica = obterValorFiltroMatriz("matrizFiltroEletrica");
    const telecom = obterValorFiltroMatriz("matrizFiltroTelecom");
    const drenagem = obterValorFiltroMatriz("matrizFiltroDrenagem");

    return obterFrentesCampo().filter(feature => {
        const p = feature.properties || {};
        if (!incluirConcluidas && ehStatusConcluidoMatriz(p)) return false;
        const contratoFeature = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        if (contrato !== "TODOS" && contratoFeature !== contrato) return false;
        if (risco !== "TODOS" && riscoFrenteMatriz(p) !== risco) return false;
        if (status !== "TODOS" && statusFrenteMatriz(p) !== status) return false;
        if (metodo !== "TODOS" && !listaMetodosFrente(p).includes(metodo)) return false;
        if (gas !== "TODOS" && valorSimNaoNormalizado(p.GAS) !== gas) return false;
        if (eletrica !== "TODOS" && valorSimNaoNormalizado(p.ELETRICIDA) !== eletrica) return false;
        if (telecom !== "TODOS" && valorSimNaoNormalizado(p.TELECON) !== telecom) return false;
        if (drenagem !== "TODOS" && valorSimNaoNormalizado(p.DRENAGEM) !== drenagem) return false;
        return true;
    });
}

function featuresParaOpcoesMatriz(filtrosIgnorados = []) {
    const ignorar = new Set(filtrosIgnorados);
    const contrato = obterValorFiltroMatriz("matrizFiltroContrato");
    const risco = obterValorFiltroMatriz("matrizFiltroRisco");
    const status = obterValorFiltroMatriz("matrizFiltroStatus");
    const metodo = obterValorFiltroMatriz("matrizFiltroMetodo");
    const gas = obterValorFiltroMatriz("matrizFiltroGas");
    const eletrica = obterValorFiltroMatriz("matrizFiltroEletrica");
    const telecom = obterValorFiltroMatriz("matrizFiltroTelecom");
    const drenagem = obterValorFiltroMatriz("matrizFiltroDrenagem");

    return obterFrentesCampo().filter(feature => {
        const p = feature.properties || {};
        if (ehStatusConcluidoMatriz(p)) return false;
        const contratoFeature = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        if (!ignorar.has("contrato") && contrato !== "TODOS" && contratoFeature !== contrato) return false;
        if (!ignorar.has("risco") && risco !== "TODOS" && riscoFrenteMatriz(p) !== risco) return false;
        if (!ignorar.has("status") && status !== "TODOS" && statusFrenteMatriz(p) !== status) return false;
        if (!ignorar.has("metodo") && metodo !== "TODOS" && !listaMetodosFrente(p).includes(metodo)) return false;
        if (!ignorar.has("gas") && gas !== "TODOS" && valorSimNaoNormalizado(p.GAS) !== gas) return false;
        if (!ignorar.has("eletrica") && eletrica !== "TODOS" && valorSimNaoNormalizado(p.ELETRICIDA) !== eletrica) return false;
        if (!ignorar.has("telecom") && telecom !== "TODOS" && valorSimNaoNormalizado(p.TELECON) !== telecom) return false;
        if (!ignorar.has("drenagem") && drenagem !== "TODOS" && valorSimNaoNormalizado(p.DRENAGEM) !== drenagem) return false;
        return true;
    });
}

function preencherSelectMatriz(id, rotuloTodos, valores, valorAtual) {
    const select = document.getElementById(id);
    if (!select) return;
    const unicos = Array.from(new Set((valores || []).filter(v => String(v || "").trim()))).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
    const atual = valorAtual || select.value || "TODOS";
    select.innerHTML = `<option value="TODOS">${escaparHtml(rotuloTodos)}</option>` + unicos.map(v => `<option value="${escaparHtml(v)}">${escaparHtml(v)}</option>`).join("");
    select.value = unicos.includes(atual) ? atual : "TODOS";
}

function atualizarOpcoesMatrizRisco() {
    preencherSelectMatriz(
        "matrizFiltroContrato",
        "Todos os contratos",
        frentesMatrizVisiveisBase().map(f => textoCampo(f.properties || {}, ["NUM_CONTRA", "CONTRATO", "Contrato"])),
        obterValorFiltroMatriz("matrizFiltroContrato")
    );

    preencherSelectMatriz(
        "matrizFiltroRisco",
        "Todos os riscos",
        featuresParaOpcoesMatriz(["risco"]).map(f => riscoFrenteMatriz(f.properties || {})),
        obterValorFiltroMatriz("matrizFiltroRisco")
    );

    preencherSelectMatriz(
        "matrizFiltroStatus",
        "Todos os status",
        featuresParaOpcoesMatriz(["status"]).map(f => statusFrenteMatriz(f.properties || {})),
        obterValorFiltroMatriz("matrizFiltroStatus")
    );

    preencherSelectMatriz(
        "matrizFiltroMetodo",
        "Todos os métodos",
        featuresParaOpcoesMatriz(["metodo"]).flatMap(f => listaMetodosFrente(f.properties || {})),
        obterValorFiltroMatriz("matrizFiltroMetodo")
    );
}

function contarMatrizPor(features, fn) {
    const r = {};
    features.forEach(feature => {
        const valor = fn(feature.properties || {}, feature) || "Não informado";
        r[valor] = (r[valor] || 0) + 1;
    });
    return r;
}

function atualizarCardsMatrizRisco(features) {
    const total = features.length;
    const riscoAlto = features.filter(f => normalizarTexto(riscoFrenteMatriz(f.properties || {})).includes("ALTO")).length;
    const comGas = features.filter(f => simNao((f.properties || {}).GAS) === "Sim").length;
    const paralisadas = features.filter(f => {
        const p = f.properties || {};
        return normalizarTexto(statusFrenteMatriz(p)).includes("PARALIS") || normalizarTexto(p.PARALISADO).includes("SIM") || !!String(p.JUSTIFICATIVA || "").trim();
    }).length;
    const somaValores = features.map(f => numeroSeguro((f.properties || {}).SOMA)).filter(n => n > 0);
    const somaMedia = somaValores.length ? somaValores.reduce((a, b) => a + b, 0) / somaValores.length : 0;

    setTexto("matrizTotalFrentes", formatarNumero(total));
    setTexto("matrizRiscoAlto", formatarNumero(riscoAlto));
    setTexto("matrizRiscoAltoPerc", total ? percentual(riscoAlto, total).toFixed(1) + "%" : "0%");
    setTexto("matrizComGas", formatarNumero(comGas));
    setTexto("matrizComGasPerc", total ? percentual(comGas, total).toFixed(1) + "%" : "0%");
    setTexto("matrizParalisadas", formatarNumero(paralisadas));
    setTexto("matrizParalisadasPerc", total ? percentual(paralisadas, total).toFixed(1) + "%" : "0%");
    setTexto("matrizSomaMedia", somaMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
}

function atualizarGraficosMatrizRisco(features) {
    graficoMatrizRisco = criarGraficoPizza("graficoMatrizRisco", "Risco", contarMatrizPor(features, p => riscoFrenteMatriz(p)), graficoMatrizRisco);
    graficoMatrizStatus = criarGraficoPizza("graficoMatrizStatus", "Status", contarMatrizPor(features, p => statusFrenteMatriz(p)), graficoMatrizStatus);

    // Os gráficos de barras da matriz foram removidos do layout.
    // Se existirem de versão anterior em cache, destruímos para evitar processamento desnecessário.
    graficoMatrizInterferencias = destruirGrafico(graficoMatrizInterferencias);
    graficoMatrizMetodos = destruirGrafico(graficoMatrizMetodos);
}

function normalizarCoordBrasil(coord) {
    if (!coord) return null;
    let lon = Number(coord.lon);
    let lat = Number(coord.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

    // As frentes da matriz ficam na região de SP. Se algum arquivo vier com sinal positivo,
    // converte para hemisfério sul/oeste sem mexer em coordenadas já negativas.
    if (lat > 0 && lat < 35) lat = -lat;
    if (lon > 0 && lon < 90) lon = -lon;

    return { lon, lat };
}


function redimensionarMapaMatrizForcado() {
    const alvo = document.getElementById("matrizMapaSatelite");
    if (!alvo || !matrizMapaOL) return;

    const rect = alvo.getBoundingClientRect();
    const largura = Math.max(300, Math.round(rect.width || alvo.clientWidth || 0));
    const altura = Math.max(240, Math.round(rect.height || alvo.clientHeight || 0));

    // O OpenLayers pode guardar o tamanho em pixels calculado no primeiro render.
    // Aqui forçamos o tamanho real do box e também atualizamos o tamanho interno do mapa.
    alvo.style.width = "100%";
    alvo.style.height = altura + "px";

    const viewport = alvo.querySelector(".ol-viewport");
    if (viewport) {
        viewport.style.position = "absolute";
        viewport.style.inset = "0";
        viewport.style.width = largura + "px";
        viewport.style.height = altura + "px";
        viewport.style.maxWidth = "none";
        viewport.style.maxHeight = "none";
    }

    const internos = alvo.querySelectorAll(".ol-unselectable, .ol-layers, .ol-layer");
    internos.forEach(el => {
        el.style.width = largura + "px";
        el.style.height = altura + "px";
        el.style.maxWidth = "none";
        el.style.maxHeight = "none";
    });

    alvo.querySelectorAll("canvas").forEach(canvas => {
        canvas.style.width = largura + "px";
        canvas.style.height = altura + "px";
        canvas.style.maxWidth = "none";
        canvas.style.maxHeight = "none";
    });

    try {
        if (typeof matrizMapaOL.setSize === "function") {
            matrizMapaOL.setSize([largura, altura]);
        }
        matrizMapaOL.updateSize();
        if (typeof matrizMapaOL.renderSync === "function") matrizMapaOL.renderSync();
    } catch (e) {
        console.warn("PONTE - não foi possível redimensionar o mapa da matriz", e);
    }
}

function agendarRedimensionamentoMapaMatriz() {
    [50, 150, 350, 700, 1200, 2000, 3500].forEach(ms => {
        setTimeout(redimensionarMapaMatrizForcado, ms);
    });
    if (window.requestAnimationFrame) {
        requestAnimationFrame(() => requestAnimationFrame(redimensionarMapaMatrizForcado));
    }
}

function garantirMapaSateliteMatriz() {
    const alvo = document.getElementById("matrizMapaSatelite");
    if (!alvo) return null;

    if (typeof ol === "undefined") {
        alvo.innerHTML = `<div class="matriz-mini-vazio">OpenLayers não carregou. Verifique se MAPA/resources/ol.js existe.</div>`;
        return null;
    }

    if (matrizMapaOL) {
        agendarRedimensionamentoMapaMatriz();
        return matrizMapaOL;
    }

    matrizFonteOL = new ol.source.Vector();

    matrizLayerPontosOL = new ol.layer.Vector({
        source: matrizFonteOL,
        style: function(feature) {
            const risco = feature.get("risco") || "";
            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: corRiscoMatriz(risco) }),
                    stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 })
                })
            });
        }
    });

    matrizMapaOL = new ol.Map({
        target: alvo,
        layers: [
            new ol.layer.Tile({
                title: "Google Satellite Hybrid",
                opacity: 0.85,
                source: new ol.source.XYZ({
                    attributions: "Google Satellite",
                    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                })
            }),
            matrizLayerPontosOL
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-46.55, -23.45]),
            zoom: 11
        }),
        controls: ol.control.defaults.defaults({
            attribution: false,
            rotate: false
        })
    });

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(function() {
            if (matrizMapaOL) {
                setTimeout(redimensionarMapaMatrizForcado, 40);
            }
        });
        ro.observe(alvo);
    }

    matrizMapaOL.on("singleclick", function(evt) {
        const feature = matrizMapaOL.forEachFeatureAtPixel(evt.pixel, f => f);
        if (!feature) return;
        const url = feature.get("urlMapa");
        if (url) window.open(url, "_blank");
    });

    matrizMapaOL.on("pointermove", function(evt) {
        const hit = matrizMapaOL.hasFeatureAtPixel(evt.pixel);
        matrizMapaOL.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    agendarRedimensionamentoMapaMatriz();
    return matrizMapaOL;
}

function atualizarMiniMapaMatriz(features) {
    const alvo = document.getElementById("matrizMapaSatelite");
    if (!alvo) return;

    const pontos = features
        .map(f => ({ feature: f, coord: normalizarCoordBrasil(coordenadaFrente(f)) }))
        .filter(p => p.coord);

    setTexto("matrizMapaResumo", `${formatarNumero(pontos.length)} com coordenada`);

    const mapa = garantirMapaSateliteMatriz();
    if (!mapa || !matrizFonteOL) return;

    matrizFonteOL.clear();

    if (!pontos.length) {
        const view = mapa.getView();
        view.setCenter(ol.proj.fromLonLat([-46.55, -23.45]));
        view.setZoom(11);
        return;
    }

    pontos.forEach(({ feature, coord }) => {
        const p = feature.properties || {};
        const id = textoCampo(p, ["ID", "FRENTE", "fid"]);
        const contrato = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        const risco = riscoFrenteMatriz(p);
        const status = statusFrenteMatriz(p);
        const url = criarUrlVerNoMapa("FRENTES", "ID", id);

        const olFeature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([coord.lon, coord.lat])),
            id,
            contrato,
            risco,
            status,
            urlMapa: url
        });
        matrizFonteOL.addFeature(olFeature);
    });

    redimensionarMapaMatrizForcado();

    const extent = matrizFonteOL.getExtent();
    if (pontos.length === 1) {
        mapa.getView().setCenter(ol.proj.fromLonLat([pontos[0].coord.lon, pontos[0].coord.lat]));
        mapa.getView().setZoom(16);
    } else if (extent && extent.every(Number.isFinite)) {
        mapa.getView().fit(extent, {
            padding: [34, 34, 34, 34],
            maxZoom: 16,
            duration: 250
        });
    }

    agendarRedimensionamentoMapaMatriz();
}

function atualizarTabelaMatriz(features) {
    const body = document.getElementById("matrizTabelaBody");
    if (!body) return;
    setTexto("matrizTabelaResumo", formatarNumero(features.length) + " registros");

    const limite = 250;
    const linhas = features.slice(0, limite).map(feature => {
        const p = feature.properties || {};
        const id = textoCampo(p, ["ID", "FRENTE", "fid"]);
        const contrato = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        const endereco = p.ENDERECO_C || p.ENDEREÇO || "";
        const url = criarUrlVerNoMapa("FRENTES", "ID", id);
        return `<tr>
            <td>${escaparHtml(id)}</td>
            <td>${escaparHtml(contrato)}</td>
            <td>${escaparHtml(statusFrenteMatriz(p))}</td>
            <td>${escaparHtml(riscoFrenteMatriz(p))}</td>
            <td>${escaparHtml(metodosFrente(p))}</td>
            <td>${escaparHtml(profundidadeFrente(p))}</td>
            <td>${escaparHtml(simNao(p.GAS))}</td>
            <td>${escaparHtml(simNao(p.ELETRICIDA))}</td>
            <td>${escaparHtml(simNao(p.TELECON))}</td>
            <td>${escaparHtml(simNao(p.DRENAGEM))}</td>
            <td>${escaparHtml(p.SOMA ?? "")}</td>
            <td class="col-endereco" title="${escaparHtml(endereco)}">${escaparHtml(enderecoCurto(endereco))}</td>
            <td>${escaparHtml(p.DT_INICIO || "")}</td>
            <td>${escaparHtml(p["DT TERMINO"] || p.DT_TERMINO || "")}</td>
            <td><a class="link-ver-mapa" href="${escaparHtml(url)}" target="_blank">Ver</a></td>
        </tr>`;
    }).join("");

    body.innerHTML = linhas || `<tr><td colspan="15">Nenhum registro encontrado para o filtro atual.</td></tr>`;
}

function atualizarMatrizRisco() {
    if (!document.getElementById("secaoMatrizRisco")) return;
    atualizarOpcoesMatrizRisco();
    const filtradas = filtrarMatrizRiscoBase();
    atualizarCardsMatrizRisco(filtradas);
    atualizarGraficosMatrizRisco(filtradas);
    atualizarMiniMapaMatriz(filtradas);
    atualizarTabelaMatriz(filtradas);
}

function limparFiltrosMatrizRisco() {
    [
        "matrizFiltroContrato",
        "matrizFiltroRisco",
        "matrizFiltroStatus",
        "matrizFiltroMetodo",
        "matrizFiltroGas",
        "matrizFiltroEletrica",
        "matrizFiltroTelecom",
        "matrizFiltroDrenagem"
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "TODOS";
    });
    atualizarMatrizRisco();
}

function exportarMatrizCSV() {
    const features = filtrarMatrizRiscoBase(true);
    const linhas = [["ID", "Contrato", "Status", "Risco", "Métodos", "Profundidade", "Gás", "Elétrica", "Telecom", "Drenagem", "Soma", "Endereço", "Data início", "Data término"]];
    features.forEach(feature => {
        const p = feature.properties || {};
        linhas.push([
            textoCampo(p, ["ID", "FRENTE", "fid"]),
            textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]),
            statusFrenteMatriz(p),
            riscoFrenteMatriz(p),
            metodosFrente(p),
            profundidadeFrente(p),
            simNao(p.GAS),
            simNao(p.ELETRICIDA),
            simNao(p.TELECON),
            simNao(p.DRENAGEM),
            p.SOMA ?? "",
            p.ENDERECO_C || p.ENDEREÇO || "",
            p.DT_INICIO || "",
            p["DT TERMINO"] || p.DT_TERMINO || ""
        ]);
    });
    const csv = linhas.map(linha => linha.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo("ponte_matriz_risco.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
}

function inicializarMatrizRisco() {
    if (matrizRiscoInicializada || !document.getElementById("secaoMatrizRisco")) return;
    matrizRiscoInicializada = true;

    [
        "matrizFiltroContrato",
        "matrizFiltroRisco",
        "matrizFiltroStatus",
        "matrizFiltroMetodo",
        "matrizFiltroGas",
        "matrizFiltroEletrica",
        "matrizFiltroTelecom",
        "matrizFiltroDrenagem"
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", atualizarMatrizRisco);
    });

    const btnLimpar = document.getElementById("btnMatrizLimpar");
    if (btnLimpar) btnLimpar.addEventListener("click", limparFiltrosMatrizRisco);

    const btnCSV = document.getElementById("btnMatrizCSV");
    if (btnCSV) btnCSV.addEventListener("click", exportarMatrizCSV);

    atualizarMatrizRisco();
}

function sincronizarFiltroMatrizContrato(contrato) {
    const select = document.getElementById("matrizFiltroContrato");
    if (!select) return;
    select.value = contrato || "TODOS";
    if (select.value !== (contrato || "TODOS")) select.value = "TODOS";
}

function inicializarDashboard() {
    atualizarMetas();
    atualizarBotaoContratoAtivo();
    atualizarDashboard();
    inicializarMatrizRisco();
    ativarCliquesDosCards();

    const btnPdf = document.getElementById("btnExportarDashboardPDF");
    if (btnPdf) btnPdf.onclick = exportarDashboardPDF;
    const btnCsv = document.getElementById("btnExportarResumoCSV");
    if (btnCsv) btnCsv.onclick = exportarResumoCSV;

    console.log("PONTE dashboard - contagens", {
        obras: obterObras().length,
        frentes: obterFrentesCampo().length,
        sinistros: obterSinistros().length,
        eee: obterEEE().length,
        lancamentos: obterLancamentos().length
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Pequeno atraso para garantir que os arquivos de camadas do qgis2web já criaram as variáveis globais.
    setTimeout(inicializarDashboard, 150);
});

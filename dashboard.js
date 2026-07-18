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
    const frentesCampo = filtrarPorContrato(obterFrentesCampo());
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

function inicializarDashboard() {
    atualizarMetas();
    atualizarBotaoContratoAtivo();
    atualizarDashboard();
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

/* PONTE - Dashboard estável
   Refeito para a exportação atual do qgis2web.
   Camadas esperadas: OBRAS_EMN2_4, FRENTES_9, SinistroEMN2_7, PONTOSDELANAMENTO_8, EEE_6.
*/

console.log("dashboard.js PONTE carregado - revisão layout, PDF e dados 2026-07-20");

let contratoSelecionado = "TODOS";
let graficoStatusObras = null;
let graficoMetodo = null;
let graficoDiametro = null;
let graficoMaterial = null;
let graficoFrentesStatus = null;
let graficoEEEStatus = null;
let graficoManchas = null;
let graficoAvancoEEE = null;
let graficoValores = null;
let graficoExtensao = null;
let graficoMatrizRisco = null;
let graficoMatrizStatus = null;
let graficoMatrizInterferencias = null;
let graficoMatrizMetodos = null;
let matrizRiscoInicializada = false;
let matrizMapaLeaflet = null;
let matrizLayerPontosLeaflet = null;
let baseDashboardLinhas = [];
let baseDashboardCsvCarregado = false;
let checklistsLinhas = [];
let checklistsCsvCarregado = false;
let graficoChecklistStatus = null;
let graficoChecklistContrato = null;
let graficoChecklistTipo = null;

const CONTRATOS_DASHBOARD_PADRAO = [
    "02069/22",
    "00268/24",
    "00272/24",
    "00274/24",
    "00277/24",
    "00797/24",
    "00900/24",
    "01151/21",
    "03179/23"
];

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

function numeroDashboard(valor) {
    if (valor === undefined || valor === null || valor === "") return 0;
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    let texto = String(valor).trim();
    if (!texto || normalizarTexto(texto) === "NULL") return 0;
    texto = texto.replace(/\s/g, "");
    const temVirgula = texto.includes(",");
    const temPonto = texto.includes(".");
    if (temVirgula && temPonto) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (temVirgula) {
        texto = texto.replace(",", ".");
    }
    const n = Number(texto);
    return Number.isFinite(n) ? n : 0;
}

function opcoesGraficoBarraBase() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
            axis: "x"
        },
        hover: {
            mode: "index",
            intersect: false
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
                callbacks: {
                    label: function(context) {
                        const label = context.dataset?.label ? context.dataset.label + ": " : "";
                        return label + formatarNumero(context.parsed?.y ?? context.raw ?? 0);
                    }
                }
            }
        },
        scales: {
            x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 20 } },
            y: { beginAtZero: true }
        }
    };
}

function valorCampo(props, campos) {
    if (!props) return "";

    // 1) tenta o nome exato do campo
    for (const campo of campos) {
        if (props[campo] !== undefined && props[campo] !== null && String(props[campo]).trim() !== "") {
            return props[campo];
        }
    }

    // 2) tenta comparar sem acento/caixa, porque o qgis2web pode exportar EXTENSÃO,
    // EXTENSÂO, EXTENSAO, campos truncados ou com diferenças pequenas de codificação.
    const mapaNormalizado = {};
    Object.keys(props).forEach(chave => {
        mapaNormalizado[normalizarTexto(chave).replace(/[^A-Z0-9]/g, "")] = chave;
    });

    for (const campo of campos) {
        const chaveNorm = normalizarTexto(campo).replace(/[^A-Z0-9]/g, "");
        const chaveReal = mapaNormalizado[chaveNorm];
        if (chaveReal && props[chaveReal] !== undefined && props[chaveReal] !== null && String(props[chaveReal]).trim() !== "") {
            return props[chaveReal];
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


function ehProjetoBasicoObra(featureOuItem) {
    const p = featureOuItem?.properties || featureOuItem || {};
    const campos = [
        p.STATUS_C, p.STATUS, p.Status, p.status,
        p.ETAPA, p.Etapa, p.etapa,
        p.TIPO, p.Tipo, p.tipo,
        p.OBJ_REDUZI, p.OBJETO, p.DESCRICAO
    ];
    return campos.some(valor => normalizarTexto(valor).includes("PROJETO BASICO"));
}

function obterObrasCadastradas() {
    return obterObras().filter(feature => !ehProjetoBasicoObra(feature));
}

function obterFrentesCampo() {
    const direto10 = obterFeaturesPorVariavel("json_FRENTES_10");
    if (direto10.length) return direto10;

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

function campoExtensaoDetectado(props) {
    if (!props) return "";
    const preferidos = [
        "EXTENSÃO", "EXTENSÂO", "EXTENSAO", "EXTENSAO_M", "EXTENSÃO_M", "EXTENSÂO_M",
        "EXT_M", "EXT", "EXTEN", "COMPRIMENTO", "COMP_M", "LENGTH", "Shape_Leng", "Shape_Length", "length"
    ];

    const direto = valorCampo(props, preferidos);
    if (direto !== "") return direto;

    const chaves = Object.keys(props);
    const candidata = chaves.find(chave => {
        const n = normalizarTexto(chave).replace(/[^A-Z0-9]/g, "");
        return n.includes("EXTENS") || n.includes("COMPR") || n.includes("LENGTH") || n.includes("SHAPELENG");
    });

    return candidata ? props[candidata] : "";
}

function distanciaHaversineMetros(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    const lon1 = Number(a[0]);
    const lat1 = Number(a[1]);
    const lon2 = Number(b[0]);
    const lat2 = Number(b[1]);
    if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) return 0;

    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const p1 = lat1 * rad;
    const p2 = lat2 * rad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function comprimentoLinhaCoordenadas(coords) {
    if (!Array.isArray(coords) || coords.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
        total += distanciaHaversineMetros(coords[i - 1], coords[i]);
    }
    return total;
}

function extensaoPorGeometria(feature) {
    const geom = feature?.geometry || {};
    const tipo = geom.type;
    const coords = geom.coordinates;

    if (tipo === "LineString") return comprimentoLinhaCoordenadas(coords);
    if (tipo === "MultiLineString") return (coords || []).reduce((soma, linha) => soma + comprimentoLinhaCoordenadas(linha), 0);
    return 0;
}

function extensaoObraFeature(feature) {
    const p = feature.properties || {};
    const valorCampoExtensao = campoExtensaoDetectado(p);
    const extCampo = numeroDashboard(valorCampoExtensao);
    if (extCampo > 0) return extCampo;

    // Se a camada ainda não foi reexportada com o campo EXTENSÃO, usa a geometria da linha como reserva.
    return extensaoPorGeometria(feature);
}

function itemObraUnica(feature) {
    const p = feature.properties || {};
    const contrato = textoCampo(p, ["NUM_CONTRA", "NUM_CONTRATO", "CONTRATO", "Contrato"]);
    const frente = textoCampo(p, ["FRENTE", "FRENTES", "Frente", "frente", "NOME_FRENTE", "NOME_OBRA", "OBRA"]);
    const chave = contrato + "|" + (frente || textoCampo(p, ["NUM_BP", "fid", "id"]) || JSON.stringify(feature.geometry || {}));

    return {
        chave,
        contrato,
        frente: frente || "Não informado",
        status: textoCampo(p, ["STATUS_C", "STATUS", "Status"]) || "Não informado",
        metodo: textoCampo(p, ["DETA_METOD", "DETA_METODO", "DETAL_METOD", "DETAL_METODO", "DETAL_MÉTODO"]) || "Não informado",
        diametro: textoCampo(p, ["DIAMETR_MM", "DIAMETRO", "DIÂMETRO", "Diâmetro"]) || "Não informado",
        extensao: extensaoObraFeature(feature),
        municipio: textoCampo(p, ["MUNICIPIO", "Município"]),
        bairro: textoCampo(p, ["BAIRRO", "Bairro"]),
        logradouro: textoCampo(p, ["LOGRADOURO", "Logradouro"])
    };
}

function escolherStatusAgregado(statusAtual, statusNovo) {
    const prioridade = [
        "OBRA EM ANDAMENTO",
        "OBRA A INICIAR",
        "PAVIMENTACAO PROVISORIA CONCLUIDA",
        "PAVIMENTACAO DEFINITIVA CONCLUIDA",
        "OBRA CONCLUIDA",
        "IMOBILIZADO",
        "SUPRIMIDO"
    ];
    const a = normalizarTexto(statusAtual);
    const b = normalizarTexto(statusNovo);
    const ia = prioridade.indexOf(a);
    const ib = prioridade.indexOf(b);
    if (ia === -1 && ib === -1) return statusAtual || statusNovo;
    if (ia === -1) return statusNovo;
    if (ib === -1) return statusAtual;
    return ib < ia ? statusNovo : statusAtual;
}

function agruparObrasUnicas(features) {
    const mapa = new Map();
    features.forEach(feature => {
        const item = itemObraUnica(feature);
        if (!mapa.has(item.chave)) {
            mapa.set(item.chave, item);
        } else {
            const existente = mapa.get(item.chave);
            existente.extensao += item.extensao || 0;
            existente.status = escolherStatusAgregado(existente.status, item.status);
            if (existente.metodo === "Não informado" && item.metodo !== "Não informado") existente.metodo = item.metodo;
            if (existente.diametro === "Não informado" && item.diametro !== "Não informado") existente.diametro = item.diametro;
        }
    });
    return Array.from(mapa.values());
}

function categoriaValidaParaGraficoObras(valor, tipo) {
    const n = normalizarTexto(valor).replace(/\s+/g, " ");
    const invalidos = [
        "NAO INFORMADO", "NAO DISPONIVEL", "N/A", "NA", "N.A", "N.D", "N.D.", "ND",
        "NULL", "-", "0", "SEM INFORMACAO", "SEM INFORMAÇÃO", "VAZIO"
    ];
    if (!n || invalidos.includes(n)) return false;
    if (n.includes("NAO INFORMADO") || n.includes("NAO DISPONIVEL")) return false;
    if (tipo === "status" && n.includes("EXISTENTE")) return false;
    return true;
}

function somarExtensaoObrasPorCampo(features, campos, tipo) {
    const r = {};
    (features || []).forEach(feature => {
        const p = feature.properties || {};
        const valor = textoCampo(p, campos) || "Não informado";
        if (!categoriaValidaParaGraficoObras(valor, tipo)) return;
        const ext = extensaoObraFeature(feature);
        if (!ext) return;
        r[valor] = (r[valor] || 0) + ext;
    });

    if (tipo === "diametro") {
        return Object.fromEntries(Object.entries(r).sort((a, b) => numeroDashboard(a[0]) - numeroDashboard(b[0])));
    }

    return Object.fromEntries(Object.entries(r).sort((a, b) => String(a[0]).localeCompare(String(b[0]), "pt-BR", { numeric: true })));
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
        options: opcoesGraficoBarraBase()
    });
}

function criarGraficoBarraExtensao(idCanvas, titulo, dados, graficoAnterior) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas || typeof Chart === "undefined") return graficoAnterior;

    destruirGrafico(graficoAnterior);

    const labels = Object.keys(dados || {});
    const valores = Object.values(dados || {});
    const opcoes = opcoesGraficoBarraBase();
    opcoes.plugins.tooltip.callbacks.label = function(context) {
        const valor = context.parsed?.y ?? context.raw ?? 0;
        return "Extensão: " + formatarNumero(valor) + " m";
    };
    opcoes.scales.y.ticks = {
        callback: function(value) { return formatarNumero(value) + " m"; }
    };

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{ label: "Extensão (m)", data: valores }]
        },
        options: opcoes
    });
}

function chaveCorMancha(valor) {
    const texto = normalizarTexto(valor);
    if (texto.includes("VERDE")) return "VERDE";
    if (texto.includes("AZUL")) return "AZUL";
    if (texto.includes("VERMELH")) return "VERMELHA";
    return texto || "NAO INFORMADO";
}

function somarEconomiasPorMancha(features) {
    const ordem = ["VERDE", "AZUL", "VERMELHA"];
    const resumo = {
        VERDE: { fatorU: 0, contrato: 0 },
        AZUL: { fatorU: 0, contrato: 0 },
        VERMELHA: { fatorU: 0, contrato: 0 }
    };

    (features || []).forEach(feature => {
        const p = feature.properties || {};
        const cor = chaveCorMancha(p.COR_MANCHA || p.COR || p.MANCHA || p.cor_mancha);
        if (!resumo[cor]) resumo[cor] = { fatorU: 0, contrato: 0 };
        resumo[cor].fatorU += numeroDashboard(valorCampo(p, ["ECON_FTU", "ECON_FATOR_U", "FATOR_U", "ECONOMIAS_FTU"]));
        resumo[cor].contrato += numeroDashboard(valorCampo(p, ["ECON_CONT", "ECON_CONTRATO", "CONTRATO_ECON", "ECONOMIAS_CONTRATO"]));
    });

    Object.keys(resumo).forEach(cor => {
        if (!ordem.includes(cor)) ordem.push(cor);
    });

    return { ordem, resumo };
}

function criarGraficoManchasEconomias(features, graficoAnterior) {
    const canvas = document.getElementById("graficoManchas");
    if (!canvas || typeof Chart === "undefined") return graficoAnterior;

    destruirGrafico(graficoAnterior);

    const { ordem, resumo } = somarEconomiasPorMancha(features || []);
    const cores = {
        VERDE: "#2ecc71",
        AZUL: "#3498db",
        VERMELHA: "#e74c3c",
        "NAO INFORMADO": "#9aa4b2"
    };
    const rotulos = {
        VERDE: "Mancha verde",
        AZUL: "Mancha azul",
        VERMELHA: "Mancha vermelha",
        "NAO INFORMADO": "Não informado"
    };

    const datasets = ordem.map(cor => ({
        label: rotulos[cor] || cor,
        data: [resumo[cor]?.fatorU || 0, resumo[cor]?.contrato || 0],
        backgroundColor: cores[cor] || "#9aa4b2",
        borderColor: cores[cor] || "#9aa4b2",
        borderWidth: 1
    }));

    const opcoes = opcoesGraficoBarraBase();
    opcoes.plugins.legend = { display: true, position: "top" };
    opcoes.plugins.tooltip.callbacks.label = function(context) {
        const valor = context.parsed?.y ?? context.raw ?? 0;
        return `${context.dataset.label}: ${formatarNumero(valor)} economia(s)`;
    };
    opcoes.scales.y.ticks = {
        callback: function(value) { return formatarNumero(value); }
    };

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Fator U", "Fator Contrato"],
            datasets
        },
        options: opcoes
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

function linhaMeta(nome, item, unidade, moeda) {
    const previsto = numeroDashboard(item?.previsto || 0);
    const realizado = numeroDashboard(item?.realizado || 0);
    const perc = percentual(realizado, previsto);
    const fmt = moeda ? formatarMoeda : function(v) { return formatarNumero(v) + (unidade ? " " + unidade : ""); };
    return [nome, fmt(previsto), fmt(realizado), perc.toFixed(2) + "%"];
}

function dadosMetasAtuais() {
    if (typeof metas === "undefined") return [];
    return [
        linhaMeta("Economias Fator U", metas.economias?.fatorU || {}, "", false),
        linhaMeta("Economias Contrato", metas.economias?.contrato || {}, "", false),
        linhaMeta("Imobilizado", metas.imobilizado || {}, "", true),
        linhaMeta("Produção Integra", metas.producao?.integra || {}, "m", false),
        linhaMeta("Produção Andamento", metas.producao?.andamento || {}, "m", false)
    ];
}

function dadosMetasProximoMes() {
    if (typeof metas === "undefined") return [];
    const prox = metas.proximoMes || {};
    return [
        linhaMeta("Economias Fator U", prox.economias?.fatorU || {}, "", false),
        linhaMeta("Economias Contrato", prox.economias?.contrato || {}, "", false),
        linhaMeta("Imobilizado", prox.imobilizado || {}, "", true),
        linhaMeta("Produção Integra", prox.producao?.integra || {}, "m", false),
        linhaMeta("Produção Andamento", prox.producao?.andamento || {}, "m", false)
    ];
}

function blocoCardsMetasModal(titulo, linhas, subtitulo) {
    let html = `<div class="metas-modal-bloco"><h3>${escaparHtml(titulo)}</h3>`;
    if (subtitulo) html += `<p class="modal-nota">${escaparHtml(subtitulo)}</p>`;
    html += `<div class="metas-modal-cards">`;
    (linhas || []).forEach(linha => {
        html += `
            <div class="metas-modal-card">
                <h4>${escaparHtml(linha[0])}</h4>
                <strong>${escaparHtml(linha[2])}</strong>
                <span>${escaparHtml(linha[3])}</span>
                <p>Meta: ${escaparHtml(linha[1])}</p>
            </div>`;
    });
    html += `</div></div>`;
    return html;
}

window.abrirMetasGeraisModal = function() {
    if (typeof metas === "undefined") return;
    const referencia = metas.proximoMes?.referencia || "próximo mês";
    const atuais = dadosMetasAtuais();
    const proximas = dadosMetasProximoMes();

    ponteModalCols = ["Seção", "Indicador", "Previsto", "Realizado", "%"];
    ponteModalRows = [
        ...atuais.map(linha => ["Metas gerais", linha[0], linha[1], linha[2], linha[3]]),
        ...proximas.map(linha => ["Previsão do mês seguinte", linha[0], linha[1], linha[2], linha[3]])
    ];

    let html = botaoExportacaoModal();
    html += blocoCardsMetasModal("Metas gerais", atuais, "Resumo do mês atual.");
    html += blocoCardsMetasModal("Previsão do mês seguinte", proximas, "Referência: " + referencia + ".");
    abrirModal("Metas Gerais", html);
};

window.abrirMetasProximoMes = window.abrirMetasGeraisModal;

function setTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.innerText = texto;
}

function detectarSeparadorCSV(linha) {
    const pontoVirgula = (linha.match(/;/g) || []).length;
    const virgula = (linha.match(/,/g) || []).length;
    return pontoVirgula >= virgula ? ";" : ",";
}

function separarLinhaCSV(linha, sep) {
    const partes = [];
    let atual = "";
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
        const ch = linha[i];
        if (ch === '"') {
            if (aspas && linha[i + 1] === '"') {
                atual += '"';
                i++;
            } else {
                aspas = !aspas;
            }
        } else if (ch === sep && !aspas) {
            partes.push(atual);
            atual = "";
        } else {
            atual += ch;
        }
    }
    partes.push(atual);
    return partes.map(v => v.trim());
}

function parseCSVDashboard(texto) {
    const linhas = String(texto || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
    if (!linhas.length) return [];
    const sep = detectarSeparadorCSV(linhas[0]);
    const cabecalho = separarLinhaCSV(linhas[0], sep);
    return linhas.slice(1).map(linha => {
        const valores = separarLinhaCSV(linha, sep);
        const obj = {};
        cabecalho.forEach((campo, i) => obj[campo] = valores[i] ?? "");
        return obj;
    });
}

function linhasBasePorTipo(tipo) {
    const alvo = normalizarTexto(tipo);
    return (baseDashboardLinhas || []).filter(linha => normalizarTexto(linha.tipo) === alvo);
}

function linhaMetaCsv(periodo, indicador) {
    const periodoNorm = normalizarTexto(periodo);
    const indicadorNorm = normalizarTexto(indicador);
    return linhasBasePorTipo("META").find(linha =>
        normalizarTexto(linha.periodo).includes(periodoNorm) &&
        normalizarTexto(linha.indicador) === indicadorNorm
    );
}

function metaDoCsv(periodo, indicador) {
    const linha = linhaMetaCsv(periodo, indicador);
    if (!linha) return null;
    return {
        previsto: numeroDashboard(linha.previsto),
        realizado: numeroDashboard(linha.realizado),
        unidade: linha.unidade || ""
    };
}

function aplicarBaseDashboardEmMetas() {
    if (!baseDashboardLinhas || !baseDashboardLinhas.length) return;

    const alvoMetas = (typeof metas !== "undefined") ? metas : (window.metas = window.metas || {});

    const ecoFU = metaDoCsv("ATUAL", "Economias Fator U");
    const ecoCT = metaDoCsv("ATUAL", "Economias Contrato");
    const imob = metaDoCsv("ATUAL", "Imobilizado");
    const prodI = metaDoCsv("ATUAL", "Producao Integra") || metaDoCsv("ATUAL", "Produção Integra");
    const prodA = metaDoCsv("ATUAL", "Producao Andamento") || metaDoCsv("ATUAL", "Produção Andamento");

    alvoMetas.economias = alvoMetas.economias || {};
    if (ecoFU) alvoMetas.economias.fatorU = ecoFU;
    if (ecoCT) alvoMetas.economias.contrato = ecoCT;
    if (imob) alvoMetas.imobilizado = imob;
    alvoMetas.producao = alvoMetas.producao || {};
    if (prodI) alvoMetas.producao.integra = prodI;
    if (prodA) alvoMetas.producao.andamento = prodA;

    const proxFU = metaDoCsv("PROXIMO", "Economias Fator U");
    const proxCT = metaDoCsv("PROXIMO", "Economias Contrato");
    const proxImob = metaDoCsv("PROXIMO", "Imobilizado");
    const proxProdI = metaDoCsv("PROXIMO", "Producao Integra") || metaDoCsv("PROXIMO", "Produção Integra");
    const proxProdA = metaDoCsv("PROXIMO", "Producao Andamento") || metaDoCsv("PROXIMO", "Produção Andamento");

    alvoMetas.proximoMes = alvoMetas.proximoMes || { referencia: "Próximo mês" };
    alvoMetas.proximoMes.economias = alvoMetas.proximoMes.economias || {};
    if (proxFU) alvoMetas.proximoMes.economias.fatorU = proxFU;
    if (proxCT) alvoMetas.proximoMes.economias.contrato = proxCT;
    if (proxImob) alvoMetas.proximoMes.imobilizado = proxImob;
    alvoMetas.proximoMes.producao = alvoMetas.proximoMes.producao || {};
    if (proxProdI) alvoMetas.proximoMes.producao.integra = proxProdI;
    if (proxProdA) alvoMetas.proximoMes.producao.andamento = proxProdA;

    const valores = linhasBasePorTipo("CONTRATO_VALOR").map(linha => ({
        contrato: linha.contrato,
        valorContratual: numeroDashboard(linha.valor_contratual),
        totalPedido: numeroDashboard(linha.total_pedido),
        totalUnitizado: numeroDashboard(linha.total_unitizado)
    })).filter(linha => linha.contrato);
    if (valores.length) alvoMetas.valoresContratos = valores;

    const extensoes = linhasBasePorTipo("CONTRATO_EXTENSAO").map(linha => ({
        contrato: linha.contrato,
        contratual: numeroDashboard(linha.ext_contratual),
        atual: numeroDashboard(linha.ext_atual),
        executada: numeroDashboard(linha.ext_executada),
        unitizada: numeroDashboard(linha.ext_unitizada)
    })).filter(linha => linha.contrato);
    if (extensoes.length) alvoMetas.extensaoContratos = extensoes;
}

async function carregarBaseDashboardCsv() {
    if (baseDashboardCsvCarregado) return;
    const caminhos = ["dados/base_dashboard_teste.csv", "dados/base_dashboard.csv"];
    for (const caminho of caminhos) {
        try {
            const resp = await fetch(caminho, { cache: "no-store" });
            if (!resp.ok) continue;
            const texto = await resp.text();
            baseDashboardLinhas = parseCSVDashboard(texto);
            aplicarBaseDashboardEmMetas();
            baseDashboardCsvCarregado = true;
            console.log("PONTE: base CSV carregada", caminho, baseDashboardLinhas.length);
            return;
        } catch (erro) {
            console.warn("PONTE: não foi possível carregar", caminho, erro);
        }
    }
    baseDashboardCsvCarregado = true;
}


/* =========================
   Checklists
========================= */

function montarRegistroChecklist(linha) {
    if (!linha) return null;
    const contrato = String(linha.contrato || linha.CONTRATO || "").trim();
    const lat = numeroDashboard(linha.lat || linha.LAT || linha.latitude || linha.Latitude || "");
    const lon = numeroDashboard(linha.lon || linha.LON || linha.longitude || linha.Longitude || "");
    return {
        codigo: String(linha.codigo || linha["Código da avaliação"] || linha.codigo_avaliacao || "").trim(),
        status: String(linha.status || linha.Status || linha.STATUS || "Não informado").trim() || "Não informado",
        contrato,
        unidade: String(linha.unidade || linha.Unidade || "").trim(),
        nomeChecklist: String(linha.nome_checklist || linha["Nome do checklist"] || linha.nome || "").trim(),
        tipoChecklist: String(linha.tipo_checklist || linha.tipo || linha.nome_checklist || linha["Nome do checklist"] || "Não informado").trim() || "Não informado",
        autor: String(linha.autor || linha.Autor || "").trim(),
        dataInicial: String(linha.data_inicial || linha["Data inicial"] || "").trim(),
        dataFinal: String(linha.data_final || linha["Data final"] || "").trim(),
        dataAprovacao: String(linha.data_aprovacao || linha["Data de aprovação"] || "").trim(),
        coordenada: String(linha.coordenada || linha.Coordenada || "").trim(),
        lat: Number.isFinite(lat) ? lat : 0,
        lon: Number.isFinite(lon) ? lon : 0,
        mesInicial: String(linha.mes_inicial || linha["Data inicial2"] || "").trim(),
        mesAprovacao: String(linha.mes_aprovacao || linha["Data de aprovação2"] || "").trim(),
        tempoFinalizar: String(linha.tempo_finalizar || linha["Tempo para finalizar"] || "").trim(),
        tempoAprovacao: String(linha.tempo_aprovacao || linha["Tempo para aprovação"] || "").trim(),
        semanaInicialAtual: String(linha.semana_inicial_atual || linha["Semana inicial atual"] || linha["SEMANA INICIAL ATUAL"] || "").trim()
    };
}

function checklistSemanaInicialAtual(item) {
    const valor = normalizarTexto(item?.semanaInicialAtual || "");
    // Se o CSV já veio filtrado e a coluna não existir, mantemos o registro.
    if (!valor) return true;
    return valor === "SIM";
}

function obterChecklists() {
    return (checklistsLinhas || [])
        .map(montarRegistroChecklist)
        .filter(Boolean)
        .filter(checklistSemanaInicialAtual);
}

async function carregarChecklistsCsv() {
    if (checklistsCsvCarregado) return;
    const caminhos = ["dados/checklists_resumo.csv", "dados/checklists.csv"];
    for (const caminho of caminhos) {
        try {
            const resp = await fetch(caminho, { cache: "no-store" });
            if (!resp.ok) continue;
            const texto = await resp.text();
            checklistsLinhas = parseCSVDashboard(texto);
            checklistsCsvCarregado = true;
            console.log("PONTE: checklists carregados", caminho, checklistsLinhas.length);
            return;
        } catch (erro) {
            console.warn("PONTE: não foi possível carregar", caminho, erro);
        }
    }
    checklistsCsvCarregado = true;
}

function filtrarChecklistsPorContrato(itens) {
    if (!contratoSelecionado || contratoSelecionado === "TODOS") return itens || [];
    return (itens || []).filter(item => String(item.contrato || "").trim() === contratoSelecionado);
}

function checklistTemCoordenada(item) {
    return item && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)) && Number(item.lat) !== 0 && Number(item.lon) !== 0;
}

function coordenadaChecklist(item) {
    if (!checklistTemCoordenada(item)) return null;
    return normalizarCoordBrasil({ lat: Number(item.lat), lon: Number(item.lon) });
}

function statusChecklistEhConcluido(status) {
    return normalizarTexto(status).includes("CONCLUID");
}

function statusChecklistEmAnalise(status) {
    const s = normalizarTexto(status);
    return s.includes("ANALISE") || s.includes("ANDAMENTO") || s.includes("REPROVADO");
}

function frentesParaAssociacaoChecklist(contrato) {
    const todas = obterFrentesCampo().filter(f => !ehStatusConcluidoMatriz(f.properties || {}));
    const mesmoContrato = todas.filter(f => textoCampo(f.properties || {}, ["NUM_CONTRA", "CONTRATO", "Contrato"]) === contrato);
    return mesmoContrato.length ? mesmoContrato : todas;
}

function associarChecklistsComFrentes(itens, raioMetros = 80) {
    const cacheFrentesPorContrato = new Map();
    return (itens || []).map(item => {
        const coordItem = coordenadaChecklist(item);
        let melhor = null;
        let melhorDist = Infinity;
        if (coordItem) {
            if (!cacheFrentesPorContrato.has(item.contrato)) {
                const frentes = frentesParaAssociacaoChecklist(item.contrato)
                    .map(feature => ({ feature, coord: normalizarCoordBrasil(coordenadaFrente(feature)) }))
                    .filter(obj => obj.coord);
                cacheFrentesPorContrato.set(item.contrato, frentes);
            }
            const frentes = cacheFrentesPorContrato.get(item.contrato) || [];
            frentes.forEach(obj => {
                const dist = distanciaHaversineMetros([coordItem.lon, coordItem.lat], [obj.coord.lon, obj.coord.lat]);
                if (dist < melhorDist) {
                    melhorDist = dist;
                    melhor = obj.feature;
                }
            });
        }
        if (!melhor || melhorDist > raioMetros) {
            return { ...item, frenteId: "", frenteContrato: "", frenteStatus: "", distanciaFrente: "", associado: false };
        }
        const p = melhor.properties || {};
        return {
            ...item,
            frenteId: textoCampo(p, ["ID", "FRENTE", "fid"]),
            frenteContrato: textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]),
            frenteStatus: statusFrenteMatriz(p),
            distanciaFrente: Math.round(melhorDist),
            associado: true
        };
    });
}

function contarChecklistsPor(itens, fn) {
    const r = {};
    (itens || []).forEach(item => {
        const valor = String(fn(item) || "Não informado").trim() || "Não informado";
        r[valor] = (r[valor] || 0) + 1;
    });
    return Object.fromEntries(Object.entries(r).sort((a, b) => String(a[0]).localeCompare(String(b[0]), "pt-BR", { numeric: true })));
}

function topChecklistsPorTipo(itens, limite = 10) {
    return Object.fromEntries(
        Object.entries(contarChecklistsPor(itens, item => item.tipoChecklist))
            .sort((a, b) => b[1] - a[1])
            .slice(0, limite)
    );
}

function contratosPadraoComDadosChecklists(itens) {
    const extras = Array.from(new Set((itens || [])
        .map(item => String(item.contrato || "").trim())
        .filter(Boolean)
        .filter(contrato => !CONTRATOS_DASHBOARD_PADRAO.includes(contrato))
    )).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

    if (contratoSelecionado && contratoSelecionado !== "TODOS") {
        return [contratoSelecionado];
    }

    return CONTRATOS_DASHBOARD_PADRAO.concat(extras);
}

function dadosChecklistPorContratoDetalhado(itens, raioMetros = 80) {
    const contratos = contratosPadraoComDadosChecklists(itens);
    const total = {};
    const vinculados = {};
    contratos.forEach(contrato => {
        total[contrato] = 0;
        vinculados[contrato] = 0;
    });

    const associados = associarChecklistsComFrentes(itens || [], raioMetros);
    associados.forEach(item => {
        const contrato = String(item.contrato || "Não informado").trim() || "Não informado";
        if (!(contrato in total)) {
            total[contrato] = 0;
            vinculados[contrato] = 0;
            contratos.push(contrato);
        }
        total[contrato] += 1;
        if (item.associado) vinculados[contrato] += 1;
    });

    const semVinculo = {};
    contratos.forEach(contrato => {
        semVinculo[contrato] = Math.max(0, (total[contrato] || 0) - (vinculados[contrato] || 0));
    });

    return { contratos, total, vinculados, semVinculo };
}

function criarGraficoChecklistContrato(idCanvas, itens, graficoAnterior, raioMetros = 80) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas || typeof Chart === "undefined") return graficoAnterior;

    destruirGrafico(graficoAnterior);

    const dados = dadosChecklistPorContratoDetalhado(itens || [], raioMetros);
    const opcoes = opcoesGraficoBarraBase();
    opcoes.plugins.legend = { display: true, position: "top" };
    opcoes.plugins.tooltip.callbacks.label = function(context) {
        const label = context.dataset?.label ? context.dataset.label + ": " : "";
        return label + formatarNumero(context.parsed?.y ?? context.raw ?? 0);
    };
    opcoes.scales.x.ticks.maxRotation = 35;
    opcoes.scales.x.ticks.minRotation = 20;
    opcoes.scales.y.ticks = { precision: 0 };

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: dados.contratos,
            datasets: [
                { label: "Total da semana", data: dados.contratos.map(c => dados.total[c] || 0) },
                { label: "Vinculados à frente", data: dados.contratos.map(c => dados.vinculados[c] || 0) },
                { label: "Sem vínculo", data: dados.contratos.map(c => dados.semVinculo[c] || 0) }
            ]
        },
        options: opcoes
    });
}

function resumoChecklists(itens, raioMetros = 80) {
    const associados = associarChecklistsComFrentes(itens, raioMetros);
    return {
        total: itens.length,
        concluidos: itens.filter(item => statusChecklistEhConcluido(item.status)).length,
        emAnalise: itens.filter(item => statusChecklistEmAnalise(item.status) && !statusChecklistEhConcluido(item.status)).length,
        comCoordenada: itens.filter(checklistTemCoordenada).length,
        associados: associados.filter(item => item.associado).length,
        associadosDetalhe: associados
    };
}

function preencherSelectChecklist(id, rotuloTodos, valores) {
    const select = document.getElementById(id);
    if (!select) return;
    const atual = select.value || "TODOS";
    const unicos = Array.from(new Set((valores || []).filter(v => String(v || "").trim()))).sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true }));
    select.innerHTML = `<option value="TODOS">${escaparHtml(rotuloTodos)}</option>` + unicos.map(v => `<option value="${escaparHtml(v)}">${escaparHtml(v)}</option>`).join("");
    select.value = unicos.includes(atual) ? atual : "TODOS";
}

function checklistFiltrosPagina() {
    return {
        contrato: document.getElementById("checklistFiltroContrato")?.value || "TODOS",
        status: document.getElementById("checklistFiltroStatus")?.value || "TODOS",
        tipo: document.getElementById("checklistFiltroTipo")?.value || "TODOS",
        associacao: document.getElementById("checklistFiltroAssociacao")?.value || "TODOS",
        raio: Number(document.getElementById("checklistRaio")?.value || 80) || 80
    };
}

function aplicarFiltrosChecklistsPagina() {
    const filtros = checklistFiltrosPagina();
    let itens = obterChecklists();
    if (filtros.contrato !== "TODOS") itens = itens.filter(item => item.contrato === filtros.contrato);
    if (filtros.status !== "TODOS") itens = itens.filter(item => item.status === filtros.status);
    if (filtros.tipo !== "TODOS") itens = itens.filter(item => item.tipoChecklist === filtros.tipo);
    const associados = associarChecklistsComFrentes(itens, filtros.raio);
    if (filtros.associacao === "ASSOCIADOS") return associados.filter(item => item.associado);
    if (filtros.associacao === "SEM_ASSOCIACAO") return associados.filter(item => !item.associado);
    return associados;
}

function atualizarOpcoesChecklistsPagina() {
    const itens = obterChecklists();
    preencherSelectChecklist("checklistFiltroContrato", "Todos os contratos", itens.map(item => item.contrato));
    preencherSelectChecklist("checklistFiltroStatus", "Todos os status", itens.map(item => item.status));
    preencherSelectChecklist("checklistFiltroTipo", "Todos os tipos", itens.map(item => item.tipoChecklist));
}

function atualizarCardsChecklistsDashboard() {
    const itens = filtrarChecklistsPorContrato(obterChecklists());
    const resumo = resumoChecklists(itens, 80);
    setTexto("totalChecklists", formatarNumero(resumo.total));
    setTexto("statusChecklists", `Concluídos: ${formatarNumero(resumo.concluidos)} | Em análise: ${formatarNumero(resumo.emAnalise)}`);
}

function atualizarChecklistsDashboardDetalhado() {
    const secao = document.getElementById("secaoChecklistsDashboard");
    if (!secao) return;

    const itens = filtrarChecklistsPorContrato(obterChecklists());
    const associados = associarChecklistsComFrentes(itens, 80);
    const resumo = resumoChecklists(itens, 80);

    setTexto("checklistDashTotal", formatarNumero(resumo.total));
    setTexto("checklistDashConcluidos", formatarNumero(resumo.concluidos));
    setTexto("checklistDashConcluidosPerc", resumo.total ? percentual(resumo.concluidos, resumo.total).toFixed(1) + "% dos checklists" : "0%");
    setTexto("checklistDashAnalise", formatarNumero(resumo.emAnalise));
    setTexto("checklistDashAnalisePerc", resumo.total ? percentual(resumo.emAnalise, resumo.total).toFixed(1) + "% dos checklists" : "0%");
    setTexto("checklistDashAssociados", formatarNumero(resumo.associados));
    setTexto("checklistDashAssociadosPerc", resumo.total ? percentual(resumo.associados, resumo.total).toFixed(1) + "% vinculados" : "0% vinculados");
    setTexto("checklistDashSemVinculo", formatarNumero(Math.max(0, resumo.total - resumo.associados)));
    setTexto("checklistDashSemVinculoPerc", resumo.total ? percentual(Math.max(0, resumo.total - resumo.associados), resumo.total).toFixed(1) + "% sem vínculo" : "0% sem vínculo");

    graficoChecklistStatus = criarGraficoBarra("graficoChecklistStatus", "Checklists por Status", contarChecklistsPor(itens, item => item.status), graficoChecklistStatus);
    graficoChecklistContrato = criarGraficoChecklistContrato("graficoChecklistContrato", itens, graficoChecklistContrato, 80);
    graficoChecklistTipo = criarGraficoBarra("graficoChecklistTipo", "Top tipos de checklist", topChecklistsPorTipo(itens, 10), graficoChecklistTipo);

    const body = document.getElementById("dashboardChecklistTabelaBody");
    const semVinculo = Math.max(0, resumo.total - resumo.associados);
    setTexto("dashboardChecklistResumo", `${formatarNumero(resumo.total)} registros da semana • ${formatarNumero(resumo.associados)} vinculados • ${formatarNumero(semVinculo)} sem vínculo`);
    if (!body) return;

    const associadosOrdenados = associados.slice().sort((a, b) => {
        if (a.associado !== b.associado) return a.associado ? 1 : -1;
        const ca = String(a.contrato || "");
        const cb = String(b.contrato || "");
        if (ca !== cb) return ca.localeCompare(cb, "pt-BR", { numeric: true });
        return String(a.codigo || "").localeCompare(String(b.codigo || ""), "pt-BR", { numeric: true });
    });

    body.innerHTML = associadosOrdenados.slice(0, 120).map(item => {
        const url = item.frenteId ? criarUrlVerNoMapa("FRENTES", "ID", item.frenteId) : "";
        return `<tr>
            <td>${escaparHtml(item.codigo)}</td>
            <td>${escaparHtml(item.contrato || "")}</td>
            <td><span class="checklist-status-badge">${escaparHtml(item.status || "")}</span></td>
            <td title="${escaparHtml(item.nomeChecklist || "")}">${escaparHtml(item.tipoChecklist || "")}</td>
            <td>${escaparHtml(item.frenteId || "Sem vínculo")}</td>
            <td>${item.distanciaFrente ? escaparHtml(item.distanciaFrente + " m") : "-"}</td>
            <td>${escaparHtml(item.dataInicial || "")}</td>
            <td>${url ? `<a class="link-ver-mapa" href="${escaparHtml(url)}" target="_blank">Ver</a>` : "-"}</td>
        </tr>`;
    }).join("") || `<tr><td colspan="8">Nenhum checklist com Semana inicial atual = SIM para o filtro atual.</td></tr>`;
}

function contagemChecklistsPorFrente(raioMetros = 80) {
    const contagem = {};
    associarChecklistsComFrentes(obterChecklists(), raioMetros).forEach(item => {
        if (!item.associado || !item.frenteId) return;
        contagem[item.frenteId] = (contagem[item.frenteId] || 0) + 1;
    });
    return contagem;
}

window.abrirDetalhesChecklists = function() {
    const itens = associarChecklistsComFrentes(filtrarChecklistsPorContrato(obterChecklists()), 80);
    ponteModalCols = ["Código", "Contrato", "Status", "Tipo", "Autor", "Data", "Frente próxima", "Distância (m)"];
    ponteModalRows = itens.map(item => [item.codigo, item.contrato, item.status, item.tipoChecklist, item.autor, item.dataInicial, item.frenteId || "", item.distanciaFrente || ""]);
    let html = botaoExportacaoModal();
    html += `<p class="modal-nota">Associação automática por proximidade geográfica com as frentes de serviço ativas. Raio padrão: 80 m.</p>`;
    html += tabelaChecklistsHtml(itens, true);
    abrirModal("Checklists", html);
};

function tabelaChecklistsHtml(itens, incluirMapa) {
    if (!itens.length) return `<p>Nenhum checklist encontrado para o filtro atual.</p>`;
    let html = `<div class="checklist-tabela-wrap"><table class="tabela-modal tabela-compacta checklist-tabela"><thead><tr>
        <th>Código</th><th>Contrato</th><th>Status</th><th>Tipo</th><th>Autor</th><th>Data</th><th>Frente próxima</th><th>Distância</th>${incluirMapa ? "<th>Mapa</th>" : ""}
    </tr></thead><tbody>`;
    itens.forEach(item => {
        const url = item.frenteId ? criarUrlVerNoMapa("FRENTES", "ID", item.frenteId) : "";
        html += `<tr>
            <td>${escaparHtml(item.codigo)}</td>
            <td>${escaparHtml(item.contrato)}</td>
            <td><span class="checklist-status-badge">${escaparHtml(item.status)}</span></td>
            <td title="${escaparHtml(item.nomeChecklist)}">${escaparHtml(item.tipoChecklist)}</td>
            <td>${escaparHtml(item.autor)}</td>
            <td>${escaparHtml(item.dataInicial)}</td>
            <td>${escaparHtml(item.frenteId || "Sem associação")}</td>
            <td>${item.distanciaFrente !== "" ? escaparHtml(item.distanciaFrente + " m") : "-"}</td>
            ${incluirMapa ? `<td>${url ? `<a class="link-ver-mapa" href="${url}" target="_blank">Ver</a>` : "-"}</td>` : ""}
        </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

function atualizarTabelaChecklistsPagina(itens) {
    const body = document.getElementById("checklistTabelaBody");
    const resumoEl = document.getElementById("checklistTabelaResumo");
    if (!body) return;
    if (resumoEl) resumoEl.innerText = `${formatarNumero(itens.length)} registros`;
    if (!itens.length) {
        body.innerHTML = `<tr><td colspan="9">Nenhum checklist encontrado para o filtro atual.</td></tr>`;
        return;
    }
    body.innerHTML = itens.map(item => {
        const url = item.frenteId ? criarUrlVerNoMapa("FRENTES", "ID", item.frenteId) : "";
        return `<tr>
            <td>${escaparHtml(item.codigo)}</td>
            <td>${escaparHtml(item.contrato)}</td>
            <td>${escaparHtml(item.status)}</td>
            <td title="${escaparHtml(item.nomeChecklist)}">${escaparHtml(item.tipoChecklist)}</td>
            <td>${escaparHtml(item.autor)}</td>
            <td>${escaparHtml(item.dataInicial)}</td>
            <td>${escaparHtml(item.frenteId || "Sem associação")}</td>
            <td>${item.distanciaFrente !== "" ? escaparHtml(item.distanciaFrente + " m") : "-"}</td>
            <td>${url ? `<a class="link-ver-mapa" href="${url}" target="_blank">Ver</a>` : "-"}</td>
        </tr>`;
    }).join("");
}

function atualizarChecklistsPage() {
    if (!document.getElementById("secaoChecklistsPage")) return;
    atualizarOpcoesChecklistsPagina();
    const filtros = checklistFiltrosPagina();
    const itens = aplicarFiltrosChecklistsPagina();
    const resumo = resumoChecklists(itens, filtros.raio);

    setTexto("checklistTotal", formatarNumero(resumo.total));
    setTexto("checklistConcluidos", formatarNumero(resumo.concluidos));
    setTexto("checklistEmAnalise", formatarNumero(resumo.emAnalise));
    setTexto("checklistAssociados", formatarNumero(resumo.associados));
    setTexto("checklistSemCoord", formatarNumero(resumo.total - resumo.comCoordenada));
    setTexto("checklistAssociadosPerc", resumo.total ? percentual(resumo.associados, resumo.total).toFixed(1) + "% vinculados" : "0% vinculados");

    graficoChecklistStatus = criarGraficoBarra("graficoChecklistStatus", "Checklists por Status", contarChecklistsPor(itens, item => item.status), graficoChecklistStatus);
    graficoChecklistContrato = criarGraficoChecklistContrato("graficoChecklistContrato", itens, graficoChecklistContrato, filtros.raio);
    graficoChecklistTipo = criarGraficoBarra("graficoChecklistTipo", "Top tipos de checklist", topChecklistsPorTipo(itens, 10), graficoChecklistTipo);

    atualizarTabelaChecklistsPagina(itens);
}

function limparFiltrosChecklists() {
    ["checklistFiltroContrato", "checklistFiltroStatus", "checklistFiltroTipo", "checklistFiltroAssociacao"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "TODOS";
    });
    const raio = document.getElementById("checklistRaio");
    if (raio) raio.value = "80";
    atualizarChecklistsPage();
}

function exportarChecklistsPaginaCSV() {
    const itens = aplicarFiltrosChecklistsPagina();
    const linhas = [["Código", "Contrato", "Status", "Tipo", "Checklist", "Autor", "Data inicial", "Coordenada", "Frente próxima", "Distância (m)"]];
    itens.forEach(item => linhas.push([item.codigo, item.contrato, item.status, item.tipoChecklist, item.nomeChecklist, item.autor, item.dataInicial, item.coordenada, item.frenteId || "", item.distanciaFrente || ""]));
    const csv = linhas.map(linha => linha.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo("ponte_checklists.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
}

async function exportarChecklistsPaginaPDF() {
    const secao = document.getElementById("secaoChecklistsPage");
    if (!secao) return;
    await exportarElementoParaPDF(secao, "ponte_checklists.pdf", "PONTE - Checklists", "p", 1.3);
}

function inicializarChecklistsPage() {
    if (!document.getElementById("secaoChecklistsPage")) return;
    ["checklistFiltroContrato", "checklistFiltroStatus", "checklistFiltroTipo", "checklistFiltroAssociacao", "checklistRaio"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", atualizarChecklistsPage);
    });
    const btnLimpar = document.getElementById("btnChecklistsLimpar");
    if (btnLimpar) btnLimpar.addEventListener("click", limparFiltrosChecklists);
    const btnCSV = document.getElementById("btnChecklistsCSV");
    if (btnCSV) btnCSV.addEventListener("click", exportarChecklistsPaginaCSV);
    const btnPDF = document.getElementById("btnChecklistsPDF");
    if (btnPDF) btnPDF.addEventListener("click", exportarChecklistsPaginaPDF);
    atualizarChecklistsPage();
}

function montarRegistroAvancoEEE(linha) {
    if (!linha) return null;

    let contrato = linha.contrato || linha.CONTRATO || "";
    let item = linha.item || linha.EEE || linha.nome || linha.NOME || "";
    let avancoRaw = linha.avanco ?? linha.percentual ?? linha.realizado ?? linha["%"] ?? "";
    let status = linha.status || linha.STATUS || "";

    // Correção robusta para CSV com um separador a mais antes da coluna item.
    // Nesse caso o nome da EEE cai na coluna avanco, a porcentagem cai em status
    // e o status real cai na coluna de cabeçalho vazio.
    const extraSemCabecalho = linha[""] || linha.extra || linha.EXTRA || "";
    const avancoTexto = String(avancoRaw ?? "").trim();
    const statusTexto = String(status ?? "").trim();
    const avancoTemTexto = /[A-Za-zÀ-ÿ]/.test(avancoTexto);
    const statusParecePercentual = /\d/.test(statusTexto) && !/[A-Za-zÀ-ÿ]/.test(statusTexto);

    if ((!item || normalizarTexto(item) === "EEE") && avancoTexto && avancoTemTexto && statusParecePercentual) {
        item = avancoTexto;
        avancoRaw = statusTexto;
        status = extraSemCabecalho;
    }

    item = String(item || "").trim();
    if (!item) item = "EEE";

    return {
        contrato: String(contrato || "").trim(),
        item,
        avanco: numeroDashboard(avancoRaw),
        status: String(status || "").trim()
    };
}

function obterAvancoEEEBase() {
    const metasObj = (typeof metas !== "undefined") ? metas : {};
    const itensMetas = metasObj.avancoEEE || metasObj.avancoPopup || metasObj.avanco_popup || [];
    const deMetas = Array.isArray(itensMetas) ? itensMetas.map(montarRegistroAvancoEEE).filter(Boolean) : [];

    const deCsv = (baseDashboardLinhas || [])
        .filter(linha => normalizarTexto(linha.tipo) === "AVANCO_POPUP" || normalizarTexto(linha.tipo) === "AVANCO_EEE")
        .map(montarRegistroAvancoEEE)
        .filter(Boolean);

    return deCsv.length ? deCsv : deMetas;
}

function filtrarAvancoEEEPorContrato(itens) {
    if (!contratoSelecionado || contratoSelecionado === "TODOS") return itens || [];
    return (itens || []).filter(item => String(item.contrato || "").trim() === contratoSelecionado);
}

function criarGraficoAvancoEEE(itens, graficoAnterior) {
    const container = document.getElementById("listaAvancoEEE");
    if (!container) return graficoAnterior;

    const dados = (itens || [])
        .filter(item => item.item)
        .sort((a, b) => String(a.item || "").localeCompare(String(b.item || ""), "pt-BR", { numeric: true }));

    container.innerHTML = "";

    if (!dados.length) {
        container.innerHTML = `<div class="lista-avanco-vazia">Nenhuma elevatória para o contrato selecionado.</div>`;
    } else {
        dados.forEach(item => {
            const valor = Math.max(0, Math.min(100, Number(item.avanco || 0)));
            const linha = document.createElement("button");
            linha.type = "button";
            linha.className = "linha-avanco-eee";
            linha.title = "Clique para abrir detalhes da elevatória";
            linha.innerHTML = `
                <span class="avanco-eee-nome">${escaparHtml(item.item || "EEE")}</span>
                <span class="avanco-eee-barra-wrap">
                    <span class="avanco-eee-barra" style="width:${valor}%"></span>
                </span>
                <span class="avanco-eee-percentual">${formatarNumero(valor)}%</span>
            `;
            linha.addEventListener("click", () => abrirDetalhesAvancoEEE(item));
            container.appendChild(linha);
        });
    }

    // Objeto compatível com exportação CSV do dashboard.
    return {
        data: {
            labels: dados.map(item => item.item),
            datasets: [{ label: "Avanço geral (%)", data: dados.map(item => item.avanco || 0) }]
        }
    };
}

function abrirDetalhesAvancoEEE(item) {
    if (!item) return;
    ponteModalCols = ["EEE", "Contrato", "Avanço geral", "Status"];
    ponteModalRows = [[item.item || "", item.contrato || "", (item.avanco || 0) + "%", item.status || ""]];
    const html = botaoExportacaoModal() + `
        <table class="tabela-modal tabela-compacta">
            <thead><tr><th>EEE</th><th>Contrato</th><th>Avanço geral</th><th>Status</th></tr></thead>
            <tbody><tr>
                <td>${escaparHtml(item.item || "")}</td>
                <td>${escaparHtml(item.contrato || "")}</td>
                <td>${escaparHtml((item.avanco || 0) + "%")}</td>
                <td>${escaparHtml(item.status || "")}</td>
            </tr></tbody>
        </table>
        <p class="modal-nota">Detalhamento por fase ainda não cadastrado. Quando a planilha por fase for incluída, este popup passa a mostrar as barras de cada etapa da elevatória.</p>
    `;
    abrirModal("Evolução da EEE", html);
}

function atualizarDashboard() {
    const obras = filtrarPorContrato(obterObrasCadastradas());
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
    atualizarCardsChecklistsDashboard();
    atualizarChecklistsDashboardDetalhado();

    const lancResumo = statusLancamentoResumo(lancamentos);
    setTexto("totalLancamentos", formatarNumero(lancResumo.total));
    setTexto("statusLancamentos", "Ativos: " + formatarNumero(lancResumo.ativos) + " | Suprimidos: " + formatarNumero(lancResumo.suprimidos));

    graficoStatusObras = criarGraficoBarraExtensao("graficoStatusObras", "Extensão por Status", somarExtensaoObrasPorCampo(obras, ["STATUS_C", "STATUS", "Status"], "status"), graficoStatusObras);
    graficoMetodo = criarGraficoBarraExtensao("graficoMetodo", "Extensão por Método", somarExtensaoObrasPorCampo(obras, ["DETA_METOD", "DETA_METODO", "DETAL_METOD", "DETAL_METODO", "DETAL_MÉTODO"], "metodo"), graficoMetodo);
    graficoDiametro = criarGraficoBarraExtensao("graficoDiametro", "Extensão por Diâmetro", somarExtensaoObrasPorCampo(obras, ["DIAMETR_MM", "DIAMETRO", "DIÂMETRO", "Diâmetro"], "diametro"), graficoDiametro);
    graficoEEEStatus = criarGraficoBarra("graficoEEEStatus", "EEE por Status", contarPorCampo(eee, "STATUS"), graficoEEEStatus);
    graficoManchas = criarGraficoManchasEconomias(manchas, graficoManchas);
    graficoAvancoEEE = criarGraficoAvancoEEE(filtrarAvancoEEEPorContrato(obterAvancoEEEBase()), graficoAvancoEEE);

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
            options: { ...opcoesGraficoBarraBase(), plugins: { ...opcoesGraficoBarraBase().plugins, legend: { display: true, position: "top" } } }
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
            options: { ...opcoesGraficoBarraBase(), plugins: { ...opcoesGraficoBarraBase().plugins, legend: { display: true, position: "top" } } }
        });
    }
}

window.filtrarContrato = function(contrato) {
    contratoSelecionado = contrato || "TODOS";
    atualizarBotaoContratoAtivo();
    atualizarDashboard();
    sincronizarFiltroMatrizContrato(contratoSelecionado);
    atualizarMatrizRisco();
    atualizarChecklistsPage();
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
    params.set("ponteZoom", "1");
    params.set("t", Date.now().toString());
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
    const obras = filtrarPorContrato(obterObrasCadastradas());
    const unicas = agruparObrasUnicas(obras);
    ponteModalCols = ["Contrato", "Frente", "Status", "Método", "Diâmetro", "Extensão total (m)", "Município", "Bairro", "Logradouro"];
    ponteModalRows = unicas.map(o => [o.contrato, o.frente, o.status, o.metodo, o.diametro, formatarNumero(o.extensao || 0), o.municipio, o.bairro, o.logradouro]);

    let html = botaoExportacaoModal();
    html += "<table class='tabela-modal tabela-compacta'><thead><tr>" + ponteModalCols.map(c => `<th>${escaparHtml(c)}</th>`).join("") + "<th>Mapa</th></tr></thead><tbody>";
    unicas.forEach(o => {
        html += "<tr>";
        [o.contrato, o.frente, o.status, o.metodo, o.diametro, formatarNumero(o.extensao || 0), o.municipio, o.bairro, o.logradouro].forEach(v => {
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
        cardChecklists: window.abrirDetalhesChecklists,
        cardLancamentos: window.abrirDetalhesLancamentos,
        tituloMetasGerais: window.abrirMetasGeraisModal
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
    await exportarElementoParaPDF(corpo, "ponte_modal.pdf", document.getElementById("modalTitulo")?.innerText || "PONTE", "p", 1.6);
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

function linhasDeGraficoCSV(titulo, grafico) {
    if (!grafico || !grafico.data) return [];
    const labels = grafico.data.labels || [];
    const linhas = [];
    (grafico.data.datasets || []).forEach(dataset => {
        (dataset.data || []).forEach((valor, i) => {
            linhas.push([titulo, "Gráfico", labels[i] ?? "", dataset.label || "Valor", valor ?? 0, ""]);
        });
    });
    return linhas;
}

function linhasDeMetasCSV(nomeSecao, linhasMetas) {
    return (linhasMetas || []).map(l => [nomeSecao, "Meta", l[0], "Previsto", l[1], "Realizado: " + l[2] + " | " + l[3]]);
}

function exportarResumoCSV() {
    const linhas = [["Seção", "Tipo", "Indicador/Categoria", "Série", "Valor", "Detalhe"]];

    linhas.push(...linhasDeMetasCSV("Metas gerais", dadosMetasAtuais()));
    linhas.push(...linhasDeMetasCSV("Previsão do mês seguinte", dadosMetasProximoMes()));

    linhas.push(["Operação", "Card", "Obras cadastradas", "Total", document.getElementById("totalObras")?.innerText || "", document.getElementById("percentualObrasProntas")?.innerText || ""]);
    linhas.push(["Operação", "Card", "Frentes em campo", "Total", document.getElementById("totalFrentes")?.innerText || "", ""]);
    linhas.push(["Operação", "Card", "Sinistros", "Total", document.getElementById("totalSinistros")?.innerText || "", ""]);
    linhas.push(["Operação", "Card", "EEE", "Total", document.getElementById("totalEEE")?.innerText || "", ""]);
    linhas.push(["Operação", "Card", "Checklists", "Total", document.getElementById("totalChecklists")?.innerText || "", document.getElementById("statusChecklists")?.innerText || ""]);
    linhas.push(["Operação", "Card", "Pontos de lançamento", "Total", document.getElementById("totalLancamentos")?.innerText || "", document.getElementById("statusLancamentos")?.innerText || ""]);

    linhas.push(["Matriz de Risco", "Card", "Frentes filtradas", "Total", document.getElementById("matrizTotalFrentes")?.innerText || "", ""]);
    linhas.push(["Matriz de Risco", "Card", "Risco alto", "Total", document.getElementById("matrizRiscoAlto")?.innerText || "", document.getElementById("matrizRiscoAltoPerc")?.innerText || ""]);
    linhas.push(["Matriz de Risco", "Card", "Com gás", "Total", document.getElementById("matrizComGas")?.innerText || "", document.getElementById("matrizComGasPerc")?.innerText || ""]);
    linhas.push(["Matriz de Risco", "Card", "Paralisadas", "Total", document.getElementById("matrizParalisadas")?.innerText || "", document.getElementById("matrizParalisadasPerc")?.innerText || ""]);
    linhas.push(["Matriz de Risco", "Card", "Em andamento", "Total", document.getElementById("matrizEmAndamento")?.innerText || "", document.getElementById("matrizEmAndamentoPerc")?.innerText || ""]);

    linhas.push(...linhasDeGraficoCSV("Extensão por Status", graficoStatusObras));
    linhas.push(...linhasDeGraficoCSV("Extensão por Método", graficoMetodo));
    linhas.push(...linhasDeGraficoCSV("Extensão por Diâmetro", graficoDiametro));
    linhas.push(...linhasDeGraficoCSV("EEE por Status", graficoEEEStatus));
    linhas.push(...linhasDeGraficoCSV("Economias por Mancha", graficoManchas));
    linhas.push(...linhasDeGraficoCSV("Evolução das EEE", graficoAvancoEEE));
    linhas.push(...linhasDeGraficoCSV("Valor Contratual x Pedido x Unitizado", graficoValores));
    linhas.push(...linhasDeGraficoCSV("Extensão Contratual x Atual x Executada x Unitizada", graficoExtensao));
    linhas.push(...linhasDeGraficoCSV("Matriz - Risco", graficoMatrizRisco));
    linhas.push(...linhasDeGraficoCSV("Matriz - Status", graficoMatrizStatus));
    linhas.push(...linhasDeGraficoCSV("Checklists por Status", graficoChecklistStatus));
    linhas.push(...linhasDeGraficoCSV("Checklists por Contrato", graficoChecklistContrato));
    linhas.push(...linhasDeGraficoCSV("Top tipos de checklist", graficoChecklistTipo));

    const csv = linhas.map(linha => linha.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo("ponte_dashboard_completo.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
}

async function exportarElementoParaPDF(elemento, nomeArquivo, titulo, orientacao, escala) {
    if (!elemento || typeof html2canvas === "undefined" || !window.jspdf) {
        window.print();
        return;
    }

    const canvas = await html2canvas(elemento, {
        scale: escala || 1.3,
        useCORS: true,
        backgroundColor: "#f4f6f8",
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(orientacao || "p", "mm", "a4");
    const margem = 8;
    const tituloAltura = 8;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const usableW = pageW - margem * 2;
    const usableHPrimeira = pageH - margem * 2 - tituloAltura;
    const usableHOutras = pageH - margem * 2;

    let yCanvas = 0;
    let pagina = 0;

    while (yCanvas < canvas.height) {
        if (pagina > 0) pdf.addPage();

        const usableH = pagina === 0 ? usableHPrimeira : usableHOutras;
        const sliceHCanvas = Math.min(canvas.height - yCanvas, Math.floor(usableH * canvas.width / usableW));
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHCanvas;
        const ctx = slice.getContext("2d");
        ctx.drawImage(canvas, 0, yCanvas, canvas.width, sliceHCanvas, 0, 0, canvas.width, sliceHCanvas);

        if (pagina === 0) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.text(titulo || "PONTE", margem, margem + 2);
        }

        const imgH = sliceHCanvas * usableW / canvas.width;
        pdf.addImage(slice.toDataURL("image/png"), "PNG", margem, pagina === 0 ? margem + tituloAltura : margem, usableW, imgH);
        yCanvas += sliceHCanvas;
        pagina++;
    }

    pdf.save(nomeArquivo);
}

async function exportarDashboardPDF() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard || typeof html2canvas === "undefined" || !window.jspdf) {
        window.print();
        return;
    }
    await exportarElementoParaPDF(dashboard, "ponte_dashboard.pdf", "PONTE - Dashboard", "p", 1.15);
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
        const statusNorm = normalizarTexto(statusFrenteMatriz(p));
        return statusNorm.includes("PARALIS")
            || statusNorm.includes("ADEQUACAO ARSESP")
            || normalizarTexto(p.PARALISADO).includes("SIM")
            || !!String(p.JUSTIFICATIVA || "").trim();
    }).length;
    const emAndamento = features.filter(f => normalizarTexto(statusFrenteMatriz(f.properties || {})).includes("ANDAMENTO")).length;

    setTexto("matrizTotalFrentes", formatarNumero(total));
    setTexto("matrizRiscoAlto", formatarNumero(riscoAlto));
    setTexto("matrizRiscoAltoPerc", total ? percentual(riscoAlto, total).toFixed(1) + "%" : "0%");
    setTexto("matrizComGas", formatarNumero(comGas));
    setTexto("matrizComGasPerc", total ? percentual(comGas, total).toFixed(1) + "%" : "0%");
    setTexto("matrizParalisadas", formatarNumero(paralisadas));
    setTexto("matrizParalisadasPerc", total ? percentual(paralisadas, total).toFixed(1) + "%" : "0%");
    setTexto("matrizEmAndamento", formatarNumero(emAndamento));
    setTexto("matrizEmAndamentoPerc", total ? percentual(emAndamento, total).toFixed(1) + "%" : "0%");
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
    if (!matrizMapaLeaflet) return;
    try {
        matrizMapaLeaflet.invalidateSize(true);
    } catch (e) {
        console.warn("PONTE - não foi possível redimensionar o mapa da matriz", e);
    }
}

function agendarRedimensionamentoMapaMatriz() {
    [50, 150, 300, 600, 1000, 1800].forEach(ms => {
        setTimeout(redimensionarMapaMatrizForcado, ms);
    });
    if (window.requestAnimationFrame) {
        requestAnimationFrame(() => requestAnimationFrame(redimensionarMapaMatrizForcado));
    }
}

function garantirMapaSateliteMatriz() {
    const alvo = document.getElementById("matrizMapaSatelite");
    if (!alvo) return null;

    if (typeof L === "undefined") {
        alvo.innerHTML = `<div class="matriz-mini-vazio">Leaflet não carregou. Verifique a conexão com a internet para carregar o mapa da matriz.</div>`;
        return null;
    }

    if (matrizMapaLeaflet) {
        agendarRedimensionamentoMapaMatriz();
        return matrizMapaLeaflet;
    }

    // Limpa qualquer sobra de renderização antiga do OpenLayers.
    alvo.innerHTML = "";

    matrizMapaLeaflet = L.map(alvo, {
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
        scrollWheelZoom: true
    }).setView([-23.45, -46.55], 11);

    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 21,
        subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }).addTo(matrizMapaLeaflet);

    matrizLayerPontosLeaflet = L.layerGroup().addTo(matrizMapaLeaflet);

    setTimeout(() => {
        redimensionarMapaMatrizForcado();
    }, 100);

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(function() {
            setTimeout(redimensionarMapaMatrizForcado, 60);
        });
        ro.observe(alvo);
    }

    agendarRedimensionamentoMapaMatriz();
    return matrizMapaLeaflet;
}

function atualizarMiniMapaMatriz(features) {
    const alvo = document.getElementById("matrizMapaSatelite");
    if (!alvo) return;

    const pontos = features
        .map(f => ({ feature: f, coord: normalizarCoordBrasil(coordenadaFrente(f)) }))
        .filter(p => p.coord);

    setTexto("matrizMapaResumo", `${formatarNumero(pontos.length)} com coordenada`);

    const mapa = garantirMapaSateliteMatriz();
    if (!mapa || !matrizLayerPontosLeaflet) return;

    matrizLayerPontosLeaflet.clearLayers();

    if (!pontos.length) {
        mapa.setView([-23.45, -46.55], 11);
        agendarRedimensionamentoMapaMatriz();
        return;
    }

    const bounds = [];
    const checklistsPorFrente = contagemChecklistsPorFrente(80);

    pontos.forEach(({ feature, coord }) => {
        const p = feature.properties || {};
        const id = textoCampo(p, ["ID", "FRENTE", "fid"]);
        const contrato = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        const risco = riscoFrenteMatriz(p);
        const status = statusFrenteMatriz(p);
        const endereco = textoCampo(p, ["ENDERECO_C", "ENDEREÇO", "ENDERECO", "ENDEREÇO_C"]);
        const url = criarUrlVerNoMapa("FRENTES", "ID", id);
        const qtdChecklists = checklistsPorFrente[id] || 0;
        const cor = corRiscoMatriz(risco);
        const latLng = [coord.lat, coord.lon];

        const marker = L.marker(latLng, {
            icon: L.divIcon({
                className: "matriz-leaflet-pin-wrapper",
                html: `<span class="matriz-leaflet-pin" style="background:${cor}"></span>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
                popupAnchor: [0, -10]
            }),
            keyboard: false
        });

        marker.bindTooltip(`${id || "Frente"} - ${risco || "Sem risco"}${qtdChecklists ? " • " + qtdChecklists + " checklists" : ""}`, {
            direction: "top",
            opacity: 0.9
        });

        marker.bindPopup(`
            <div class="matriz-popup-mapa">
                <strong>${escaparHtml(id || "Frente")}</strong><br>
                Contrato: ${escaparHtml(contrato || "-")}<br>
                Risco: ${escaparHtml(risco || "-")}<br>
                Status: ${escaparHtml(status || "-")}<br>
                Checklists da semana: ${escaparHtml(qtdChecklists)}<br>
                ${endereco ? `Endereço: ${escaparHtml(endereco).slice(0, 120)}<br>` : ""}
                <a href="${url}" target="_blank">Ver no mapa principal</a>
            </div>
        `);

        marker.on("click", function() {
            // Mantém o popup aberto. O link dentro dele abre o mapa principal com zoom.
        });

        marker.addTo(matrizLayerPontosLeaflet);
        if (typeof marker.setZIndexOffset === "function") marker.setZIndexOffset(1000);
        bounds.push(latLng);
    });

    redimensionarMapaMatrizForcado();

    if (bounds.length === 1) {
        mapa.setView(bounds[0], 16);
    } else {
        mapa.fitBounds(bounds, {
            padding: [28, 28],
            maxZoom: 16
        });
    }

    agendarRedimensionamentoMapaMatriz();
}

function atualizarTabelaMatriz(features) {
    const body = document.getElementById("matrizTabelaBody");
    if (!body) return;
    setTexto("matrizTabelaResumo", formatarNumero(features.length) + " registros");

    const limite = 250;
    const checklistsPorFrente = contagemChecklistsPorFrente(80);
    const linhas = features.slice(0, limite).map(feature => {
        const p = feature.properties || {};
        const id = textoCampo(p, ["ID", "FRENTE", "fid"]);
        const contrato = textoCampo(p, ["NUM_CONTRA", "CONTRATO", "Contrato"]);
        const endereco = p.ENDERECO_C || p.ENDEREÇO || "";
        const url = criarUrlVerNoMapa("FRENTES", "ID", id);
        const qtdChecklists = checklistsPorFrente[id] || 0;
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
            <td>${escaparHtml(qtdChecklists)}</td>
            <td><a class="link-ver-mapa" href="${escaparHtml(url)}" target="_blank">Ver</a></td>
        </tr>`;
    }).join("");

    body.innerHTML = linhas || `<tr><td colspan="16">Nenhum registro encontrado para o filtro atual.</td></tr>`;
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
    const checklistsPorFrente = contagemChecklistsPorFrente(80);
    const linhas = [["ID", "Contrato", "Status", "Risco", "Métodos", "Profundidade", "Gás", "Elétrica", "Telecom", "Drenagem", "Soma", "Endereço", "Data início", "Data término", "Checklists da semana"]];
    features.forEach(feature => {
        const p = feature.properties || {};
        const id = textoCampo(p, ["ID", "FRENTE", "fid"]);
        linhas.push([
            id,
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
            p["DT TERMINO"] || p.DT_TERMINO || "",
            checklistsPorFrente[id] || 0
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
    carregarBaseDashboardCsv().then(function() {
        atualizarMetas();
        atualizarDashboard();
    });
    carregarChecklistsCsv().then(function() {
        atualizarDashboard();
        inicializarChecklistsPage();
        atualizarMatrizRisco();
    });
    inicializarMatrizRisco();
    ativarCliquesDosCards();

    const btnPdf = document.getElementById("btnExportarDashboardPDF");
    if (btnPdf) btnPdf.onclick = exportarDashboardPDF;
    const btnCsv = document.getElementById("btnExportarResumoCSV");
    if (btnCsv) btnCsv.onclick = exportarResumoCSV;

    console.log("PONTE dashboard - contagens", {
        obras: obterObrasCadastradas().length,
        frentes: obterFrentesCampo().length,
        sinistros: obterSinistros().length,
        eee: obterEEE().length,
        lancamentos: obterLancamentos().length,
        checklists: obterChecklists().length
    });
}

document.addEventListener("DOMContentLoaded", function() {
    // Pequeno atraso para garantir que os arquivos de camadas do qgis2web já criaram as variáveis globais.
    setTimeout(inicializarDashboard, 150);
});

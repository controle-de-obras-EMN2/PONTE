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

function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function percentual(realizado, previsto) {
    if (!previsto || previsto === 0) return 0;
    return (realizado / previsto) * 100;
}

function obterFeatures(nomeVariavel) {
    if (!window[nomeVariavel]) {
        console.warn("Camada não encontrada:", nomeVariavel);
        return [];
    }

    return window[nomeVariavel].features || [];
}

function filtrarContrato(contrato) {
    contratoSelecionado = contrato;
    atualizarDashboard();
}

function filtrarPorContrato(features, campoContrato) {
    if (contratoSelecionado === "TODOS") return features;

    return features.filter(feature =>
        String(feature.properties?.[campoContrato] || "").trim() === contratoSelecionado
    );
}

function agruparFrentesUnicas(obras) {
    const mapa = {};

    obras.forEach(feature => {
        const p = feature.properties || {};
        const frente = p.FRENTE || "Não informado";

        if (!mapa[frente]) {
            mapa[frente] = {
                frente: frente,
                contrato: p.NUM_CONTRA || "",
                status: p.STATUS_C || "Não informado",
                metodo: p.METODO || "Não informado",
                diametro: p.DIAMETR_MM || "Não informado",
                material: p.MATERIAL || p.TIPO || "Não informado"
            };
        }
    });

    return Object.values(mapa);
}

function contarPorCampo(features, campo) {
    const contagem = {};

    features.forEach(feature => {
        const valor = feature.properties?.[campo] || "Não informado";
        contagem[valor] = (contagem[valor] || 0) + 1;
    });

    return contagem;
}

function contarPorCampoArray(lista, campo) {
    const contagem = {};

    lista.forEach(item => {
        const valor = item[campo] || "Não informado";
        contagem[valor] = (contagem[valor] || 0) + 1;
    });

    return contagem;
}

function manchasPorCor(features) {
    const resultado = {};

    features.forEach(feature => {
        const p = feature.properties || {};
        const cor = p.COR_MANCHA || "Não informado";

        if (!resultado[cor]) {
            resultado[cor] = {
                ftu: 0,
                contrato: 0
            };
        }

        resultado[cor].ftu += Number(p.ECON_FTU) || 0;
        resultado[cor].contrato += Number(p.ECON_CONT) || 0;
    });

    return resultado;
}

function destruirGrafico(grafico) {
    if (grafico) {
        grafico.destroy();
    }
}

function criarGraficoBarra(idCanvas, titulo, dados, graficoExistente) {
    destruirGrafico(graficoExistente);

    const canvas = document.getElementById(idCanvas);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(dados),
            datasets: [{
                label: titulo,
                data: Object.values(dados)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                tooltip: {
                    enabled: true
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function criarGraficoManchas(idCanvas, dados, graficoExistente) {
    destruirGrafico(graficoExistente);

    const canvas = document.getElementById(idCanvas);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(dados),
            datasets: [
                {
                    label: "Economias Fator U",
                    data: Object.values(dados).map(item => item.ftu)
                },
                {
                    label: "Economias Contrato",
                    data: Object.values(dados).map(item => item.contrato)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": " + formatarNumero(context.raw);
                        }
                    }
                },
                legend: {
                    position: "bottom"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatarNumero(value);
                        }
                    }
                }
            }
        }
    });
}

function carregarMetasGerais() {
    const ecoFU = metas.economias.fatorU;
    const ecoContrato = metas.economias.contrato;
    const imob = metas.imobilizado;
    const prodIntegra = metas.producao.integra;
    const prodAndamento = metas.producao.andamento;

    document.getElementById("ecoFatorUReal").innerText = formatarNumero(ecoFU.realizado);
    document.getElementById("ecoFatorUPerc").innerText = percentual(ecoFU.realizado, ecoFU.previsto).toFixed(2) + "%";
    document.getElementById("ecoFatorUMeta").innerText = "Meta: " + formatarNumero(ecoFU.previsto);

    document.getElementById("ecoContratoReal").innerText = formatarNumero(ecoContrato.realizado);
    document.getElementById("ecoContratoPerc").innerText = percentual(ecoContrato.realizado, ecoContrato.previsto).toFixed(2) + "%";
    document.getElementById("ecoContratoMeta").innerText = "Meta: " + formatarNumero(ecoContrato.previsto);

    document.getElementById("imobReal").innerText = formatarMoeda(imob.realizado);
    document.getElementById("imobPerc").innerText = percentual(imob.realizado, imob.previsto).toFixed(2) + "%";
    document.getElementById("imobMeta").innerText = "Meta: " + formatarMoeda(imob.previsto);

    document.getElementById("prodIntegraReal").innerText = formatarNumero(prodIntegra.realizado) + " m";
    document.getElementById("prodIntegraPerc").innerText = percentual(prodIntegra.realizado, prodIntegra.previsto).toFixed(2) + "%";
    document.getElementById("prodIntegraMeta").innerText = "Meta: " + formatarNumero(prodIntegra.previsto) + " m";

    document.getElementById("prodAndamentoReal").innerText = formatarNumero(prodAndamento.realizado) + " m";
    document.getElementById("prodAndamentoPerc").innerText = percentual(prodAndamento.realizado, prodAndamento.previsto).toFixed(2) + "%";
    document.getElementById("prodAndamentoMeta").innerText = "Meta: " + formatarNumero(prodAndamento.previsto) + " m";
}

function filtrarPorContratoMultiplosCampos(features, camposPossiveis) {
    if (contratoSelecionado === "TODOS") return features;

    return features.filter(feature => {
        const p = feature.properties || {};

        return camposPossiveis.some(campo =>
            String(p[campo] || "").trim() === contratoSelecionado
        );
    });
}

function somarMaterialPreparado(obras) {
    const resultado = {};

    obras.forEach(feature => {
        const p = feature.properties || {};

        const material = p.MATERIAL || p.Material || p.material;

        if (!material) return;

        resultado[material] = (resultado[material] || 0) + 1;
    });

    return resultado;
}

function atualizarDashboard() {
    const obrasTodas = obterFeatures("json_OBRAS_EMN2_4");
    const eeeTodas = obterFeatures("json_EEE_6");
    const sinistrosTodas = obterFeatures("json_SinistroEMN2_7");
    const frentesTodas = obterFeatures("json_EMN2Frentes_em_Andamento_9");
    const manchasTodas = obterFeatures("json_VIRADADEMANCHA_2");

    const lancamentosTodas = window.json_PONTOSDELANAMENTO_1?.features || [];

    const obras = filtrarPorContrato(obrasTodas, "NUM_CONTRA");

    const sinistros = filtrarPorContrato(sinistrosTodas, "Contrato");

    const frentes = filtrarPorContratoMultiplosCampos(frentesTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const lancamentos = filtrarPorContratoMultiplosCampos(lancamentosTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const eee = filtrarPorContratoMultiplosCampos(eeeTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const frentesUnicas = agruparFrentesUnicas(obras);

    const statusProntos = [
        "OBRA CONCLUÍDA",
        "OBRA CONCLUIDA",
        "PAVIMENTAÇÃO PROVISÓRIA CONCLUÍDA",
        "PAVIMENTACAO PROVISORIA CONCLUIDA",
        "PAVIMENTAÇÃO DEFINITIVA CONCLUÍDA",
        "PAVIMENTACAO DEFINITIVA CONCLUIDA",
        "IMOBILIZADO"
    ];

    const prontas = frentesUnicas.filter(item =>
        statusProntos.includes(String(item.status).trim().toUpperCase())
    ).length;

    const percentualProntas = frentesUnicas.length
        ? percentual(prontas, frentesUnicas.length)
        : 0;

    document.getElementById("totalObras").innerText = frentesUnicas.length.toLocaleString("pt-BR");

    if (document.getElementById("percentualObrasProntas")) {
        document.getElementById("percentualObrasProntas").innerText = percentualProntas.toFixed(1) + "% prontas";
    }

    document.getElementById("totalFrentes").innerText = frentes.length.toLocaleString("pt-BR");
    document.getElementById("totalSinistros").innerText = sinistros.length.toLocaleString("pt-BR");
    document.getElementById("totalEEE").innerText = eee.length.toLocaleString("pt-BR");

    if (document.getElementById("totalLancamentos")) {
        document.getElementById("totalLancamentos").innerText = lancamentos.length.toLocaleString("pt-BR");
    }

    graficoStatusObras = criarGraficoBarra(
        "graficoStatusObras",
        "Obras por Status",
        contarPorCampoArray(frentesUnicas, "status"),
        graficoStatusObras
    );

    graficoMetodo = criarGraficoBarra(
        "graficoMetodo",
        "Obras por Método",
        contarPorCampoArray(frentesUnicas, "metodo"),
        graficoMetodo
    );

    graficoDiametro = criarGraficoBarra(
        "graficoDiametro",
        "Obras por Diâmetro",
        contarPorCampoArray(frentesUnicas, "diametro"),
        graficoDiametro
    );

    graficoMaterial = criarGraficoBarra(
        "graficoMaterial",
        "Obras por Material",
        somarMaterialPreparado(obras),
        graficoMaterial
    );

    graficoFrentesStatus = criarGraficoBarra(
        "graficoFrentesStatus",
        "Frentes por Status",
        contarPorCampo(frentes, "STATUS"),
        graficoFrentesStatus
    );

    graficoEEEStatus = criarGraficoBarra(
        "graficoEEEStatus",
        "EEE por Status",
        contarPorCampo(eee, "STATUS"),
        graficoEEEStatus
    );

    graficoManchas = criarGraficoManchas(
        "graficoManchas",
        manchasPorCor(manchasTodas),
        graficoManchas
    );
}

function criarGraficosFixos() {
    graficoValores = new Chart(document.getElementById("graficoValores"), {
        type: "bar",
        data: {
            labels: metas.valoresContratos.map(item => item.contrato),
            datasets: [
                {
                    label: "Valor Contratual",
                    data: metas.valoresContratos.map(item => item.valorContratual)
                },
                {
                    label: "Total Pedido",
                    data: metas.valoresContratos.map(item => item.totalPedido)
                },
                {
                    label: "Total Unitizado",
                    data: metas.valoresContratos.map(item => item.totalUnitizado)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": " + formatarMoeda(context.raw);
                        }
                    }
                },
                legend: {
                    position: "bottom"
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return "R$ " + (value / 1000000).toFixed(0) + " mi";
                        }
                    }
                }
            }
        }
    });

    graficoExtensao = new Chart(document.getElementById("graficoExtensao"), {
        type: "bar",
        data: {
            labels: metas.extensaoContratos.map(item => item.contrato),
            datasets: [
                {
                    label: "Extensão Contratual",
                    data: metas.extensaoContratos.map(item => item.contratual)
                },
                {
                    label: "Extensão Atual",
                    data: metas.extensaoContratos.map(item => item.atual)
                },
                {
                    label: "Extensão Executada",
                    data: metas.extensaoContratos.map(item => item.executada)
                },
                {
                    label: "Extensão Unitizada",
                    data: metas.extensaoContratos.map(item => item.unitizada)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": " + formatarNumero(context.raw) + " m";
                        }
                    }
                },
                legend: {
                    position: "bottom"
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatarNumero(value) + " m";
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    carregarMetasGerais();
    atualizarDashboard();
    criarGraficosFixos();
});

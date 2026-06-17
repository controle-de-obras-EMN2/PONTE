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

function obterCamadaPorParteDoNome(parteNome) {
    const nome = Object.keys(window).find(chave =>
        chave.startsWith("json_") &&
        chave.toLowerCase().includes(parteNome.toLowerCase())
    );

    if (!nome) {
        console.warn("Camada não encontrada contendo:", parteNome);
        return [];
    }

    console.log("Camada encontrada:", nome);
    return window[nome].features || [];
}

function contarStatusLancamentos(features) {
    const resultado = {
        total: features.length,
        ativos: 0,
        suprimidos: 0
    };

    features.forEach(feature => {
        const p = feature.properties || {};
        const status = String(
            p.STATUS || p.Status || p.status || p.SITUACAO || p.Situação || ""
        ).toUpperCase();

        if (
            status.includes("ATIVO") ||
            status.includes("EXISTENTE") ||
            status.includes("PENDENTE")
        ) {
            resultado.ativos++;
        }

        if (
            status.includes("SUPRIMIDO") ||
            status.includes("ELIMINADO") ||
            status.includes("INATIVO")
        ) {
            resultado.suprimidos++;
        }
    });

    return resultado;
}

function atualizarDashboard() {
    const obrasTodas = obterFeatures("json_OBRAS_EMN2_4");
    const eeeTodas = obterFeatures("json_EEE_6");
    const sinistrosTodas = obterFeatures("json_SinistroEMN2_7");
    const frentesTodas = obterFeatures("json_EMN2Frentes_em_Andamento_9");
    const manchasTodas = obterFeatures("json_VIRADADEMANCHA_2");

    const lancamentosTodas =
    obterCamadaPorParteDoNome("LANCA").length ? obterCamadaPorParteDoNome("LANCA") :
    obterCamadaPorParteDoNome("LANÇ").length ? obterCamadaPorParteDoNome("LANÇ") :
    obterCamadaPorParteDoNome("PONTOS").length ? obterCamadaPorParteDoNome("PONTOS") :
    obterCamadaPorParteDoNome("PONTO");

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

    const resumoLancamentos = contarStatusLancamentos(lancamentos);

if (document.getElementById("totalLancamentos")) {
    document.getElementById("totalLancamentos").innerText = resumoLancamentos.total.toLocaleString("pt-BR");
}

if (document.getElementById("statusLancamentos")) {
    document.getElementById("statusLancamentos").innerText =
        "Ativos: " + resumoLancamentos.ativos.toLocaleString("pt-BR") +
        " | Suprimidos: " + resumoLancamentos.suprimidos.toLocaleString("pt-BR");
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

function abrirModal(titulo, conteudo) {
    document.getElementById("modalTitulo").innerText = titulo;
    document.getElementById("modalCorpo").innerHTML = conteudo;
    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function tabelaDeAtributos(features, campos) {
    if (!features || features.length === 0) {
        return "<p>Nenhum registro encontrado.</p>";
    }

    let html = "<table class='tabela-modal'><thead><tr>";

    campos.forEach(campo => {
        html += "<th>" + campo + "</th>";
    });

    html += "</tr></thead><tbody>";

    features.forEach(feature => {
        const p = feature.properties || {};
        html += "<tr>";

        campos.forEach(campo => {
            html += "<td>" + (p[campo] ?? "") + "</td>";
        });

        html += "</tr>";
    });

    html += "</tbody></table>";

    return html;
}

function cardMetaHtml(titulo, previsto, realizado, unidade = "") {
    return `
        <div class="card">
            <h3>${titulo}</h3>
            <strong>${unidade === "R$" ? formatarMoeda(realizado) : formatarNumero(realizado) + unidade}</strong>
            <span>${percentual(realizado, previsto).toFixed(2)}%</span>
            <p>Previsto: ${unidade === "R$" ? formatarMoeda(previsto) : formatarNumero(previsto) + unidade}</p>
        </div>
    `;
}

function abrirDetalhesMetas() {
    const atual = `
        <h3 style="color:#0b2f5b;margin-top:0;">Metas consolidadas atuais</h3>

        <div class="cards cards-5">

            ${cardMetaHtml("Economias Fator U", metas.economias.fatorU.previsto, metas.economias.fatorU.realizado)}

            ${cardMetaHtml("Economias Contrato", metas.economias.contrato.previsto, metas.economias.contrato.realizado)}

            ${cardMetaHtml("Imobilizado", metas.imobilizado.previsto, metas.imobilizado.realizado, "R$")}

            ${cardMetaHtml("Produção Integra", metas.producao.integra.previsto, metas.producao.integra.realizado, " m")}

            ${cardMetaHtml("Produção Andamento", metas.producao.andamento.previsto, metas.producao.andamento.realizado, " m")}

        </div>
    `;

    const prox = metas.proximoMes;

    const proximoMesHtml = `
        <h3 style="color:#0b2f5b;margin-top:28px;">Previsão para o próximo mês - ${prox.referencia}</h3>

        <div class="cards cards-5">

            ${cardMetaHtml("Economias Fator U", prox.economias.fatorU.previsto, prox.economias.fatorU.realizado)}

            ${cardMetaHtml("Economias Contrato", prox.economias.contrato.previsto, prox.economias.contrato.realizado)}

            ${cardMetaHtml("Imobilizado", prox.imobilizado.previsto, prox.imobilizado.realizado, "R$")}

            ${cardMetaHtml("Produção Integra", prox.producao.integra.previsto, prox.producao.integra.realizado, " m")}

            ${cardMetaHtml("Produção Andamento", prox.producao.andamento.previsto, prox.producao.andamento.realizado, " m")}

        </div>
    `;

    abrirModal("Metas Gerais", atual + proximoMesHtml);
}

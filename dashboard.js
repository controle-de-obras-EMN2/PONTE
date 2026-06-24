/* =========================================================
   DASHBOARD PONTE
   ========================================================= */

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


/* =========================================================
   FORMATADORES
   ========================================================= */

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

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}


/* =========================================================
   LEITURA DAS CAMADAS
   ========================================================= */

function obterFeatures(nomeVariavel) {
    if (!window[nomeVariavel]) {
        console.warn("Camada não encontrada:", nomeVariavel);
        return [];
    }

    return window[nomeVariavel].features || [];
}

function obterCamadaPorParteDoNome(partesNome) {
    const partes = Array.isArray(partesNome) ? partesNome : [partesNome];

    const nome = Object.keys(window).find(chave => {
        if (!chave.startsWith("json_")) return false;

        const chaveNormalizada = normalizarTexto(chave);

        return partes.some(parte =>
            chaveNormalizada.includes(normalizarTexto(parte))
        );
    });

    if (!nome) {
        console.warn("Camada não encontrada contendo:", partes.join(", "));
        return [];
    }

    console.log("Camada encontrada:", nome);
    return window[nome].features || [];
}


/* =========================================================
   FILTROS
   ========================================================= */

window.filtrarContrato = function(contrato) {
    contratoSelecionado = contrato;

    atualizarDashboard();
    atualizarBotaoContratoAtivo();
};

function filtrarPorContrato(features, campoContrato) {
    if (contratoSelecionado === "TODOS") return features;

    return features.filter(feature =>
        String(feature.properties?.[campoContrato] || "").trim() === contratoSelecionado
    );
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

function atualizarBotaoContratoAtivo() {
    const botoes = document.querySelectorAll(".filtros-dashboard button");

    botoes.forEach(botao => {
        const textoBotao = botao.innerText.trim();

        botao.classList.remove("ativo");

        if (
            contratoSelecionado === "TODOS" &&
            textoBotao.toUpperCase() === "TODOS"
        ) {
            botao.classList.add("ativo");
        }

        if (textoBotao === contratoSelecionado) {
            botao.classList.add("ativo");
        }
    });
}


/* =========================================================
   AGRUPAMENTOS E CONTAGENS
   ========================================================= */

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
                material: p.MATERIAL || p.Material || p.material || ""
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

function contarStatusLancamentos(features) {
    const resultado = {
        total: features.length,
        ativos: 0,
        suprimidos: 0
    };

    features.forEach(feature => {
        const p = feature.properties || {};

        const status = normalizarTexto(
            p.STATUS ||
            p.Status ||
            p.status ||
            p.SITUACAO ||
            p.Situação ||
            ""
        );

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


/* =========================================================
   GRÁFICOS
   ========================================================= */

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


/* =========================================================
   METAS GERAIS
   ========================================================= */

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


/* =========================================================
   ATUALIZAÇÃO DO DASHBOARD
   ========================================================= */

function atualizarDashboard() {
    const obrasTodas = obterFeatures("json_OBRAS_EMN2_4");
    const eeeTodas = obterFeatures("json_EEE_6");
    const sinistrosTodas = obterFeatures("json_SinistroEMN2_7");
    const frentesTodas = obterFeatures("json_EMN2Frentes_em_Andamento_9");
    const manchasTodas = obterFeatures("json_VIRADADEMANCHA_2");

    const lancamentosTodas = obterCamadaPorParteDoNome([
        "PONTOSDELANAMENTO",
        "PONTOS",
        "LANCA",
        "LANCAMENTO",
        "LANÇAMENTO"
    ]);

    const obras = filtrarPorContrato(obrasTodas, "NUM_CONTRA");

    const sinistros = filtrarPorContratoMultiplosCampos(sinistrosTodas, [
        "Contrato",
        "CONTRATO",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const frentes = filtrarPorContratoMultiplosCampos(frentesTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const lancamentos = filtrarPorContratoMultiplosCampos(lancamentosTodas, [
        "Contrato",
        "CONTRATO",
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
        "OBRA CONCLUIDA",
        "PAVIMENTACAO PROVISORIA CONCLUIDA",
        "PAVIMENTACAO DEFINITIVA CONCLUIDA",
        "IMOBILIZADO"
    ];

    const prontas = frentesUnicas.filter(item =>
        statusProntos.includes(normalizarTexto(item.status))
    ).length;

    const percentualProntas = frentesUnicas.length
        ? percentual(prontas, frentesUnicas.length)
        : 0;

    document.getElementById("totalObras").innerText = frentesUnicas.length.toLocaleString("pt-BR");

    if (document.getElementById("percentualObrasProntas")) {
        document.getElementById("percentualObrasProntas").innerText =
            percentualProntas.toFixed(1) + "% prontas";
    }

    document.getElementById("totalFrentes").innerText = frentes.length.toLocaleString("pt-BR");
    document.getElementById("totalSinistros").innerText = sinistros.length.toLocaleString("pt-BR");
    document.getElementById("totalEEE").innerText = eee.length.toLocaleString("pt-BR");

    const resumoLancamentos = contarStatusLancamentos(lancamentos);

    if (document.getElementById("totalLancamentos")) {
        document.getElementById("totalLancamentos").innerText =
            resumoLancamentos.total.toLocaleString("pt-BR");
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


/* =========================================================
   GRÁFICOS FIXOS DE CONTRATOS
   ========================================================= */

function criarGraficosFixos() {
    const canvasValores = document.getElementById("graficoValores");
    const canvasExtensao = document.getElementById("graficoExtensao");

    if (canvasValores) {
        graficoValores = new Chart(canvasValores, {
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
    }

    if (canvasExtensao) {
        graficoExtensao = new Chart(canvasExtensao, {
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
}


/* =========================================================
   MODAL / POP-UPS
   ========================================================= */

window.abrirModal = function(titulo, conteudo) {
    const modal = document.getElementById("modal");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalCorpo = document.getElementById("modalCorpo");

    if (!modal || !modalTitulo || !modalCorpo) {
        console.error("Modal não encontrado no HTML.");
        return;
    }

    modalTitulo.innerText = titulo;
    modalCorpo.innerHTML = conteudo;

    modal.style.display = "flex";
    modal.classList.add("is-open");

    document.body.classList.add("modal-open");
};

window.fecharModal = function() {
    const modal = document.getElementById("modal");

    if (modal) {
        modal.classList.remove("is-open");
        modal.style.display = "none";
    }

    document.body.classList.remove("modal-open");
};

function gerarTabelaModal(features, campos) {
    if (!features || features.length === 0) {
        return "<p>Nenhum registro encontrado para o filtro atual.</p>";
    }

    let html = "<table class='tabela-modal'><thead><tr>";

    campos.forEach(campo => {
        html += "<th>" + campo.titulo + "</th>";
    });

    html += "</tr></thead><tbody>";

    features.forEach(feature => {
        const p = feature.properties || {};
        html += "<tr>";

        campos.forEach(campo => {
            html += "<td>" + (p[campo.campo] ?? "") + "</td>";
        });

        html += "</tr>";
    });

    html += "</tbody></table>";

    return html;
}

function filtrarContratoModal(features, camposContrato) {
    return filtrarPorContratoMultiplosCampos(features, camposContrato);
}

function cardMetaHtml(titulo, previsto, realizado, unidade = "") {
    const valorRealizado = unidade === "R$"
        ? formatarMoeda(realizado)
        : formatarNumero(realizado) + unidade;

    const valorPrevisto = unidade === "R$"
        ? formatarMoeda(previsto)
        : formatarNumero(previsto) + unidade;

    return `
        <div class="card">
            <h3>${titulo}</h3>
            <strong>${valorRealizado}</strong>
            <span>${percentual(realizado, previsto).toFixed(2)}%</span>
            <p>Previsto: ${valorPrevisto}</p>
        </div>
    `;
}

window.abrirDetalhesMetas = function() {
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
};

window.abrirDetalhesObras = function() {
    const obrasTodas = obterFeatures("json_OBRAS_EMN2_4");

    const obras = filtrarContratoModal(obrasTodas, [
        "NUM_CONTRA",
        "CONTRATO",
        "Contrato",
        "contrato"
    ]);

    abrirModal(
        "Detalhes das Obras",
        gerarTabelaModal(obras, [
            { titulo: "Contrato", campo: "NUM_CONTRA" },
            { titulo: "Frente", campo: "FRENTE" },
            { titulo: "Status", campo: "STATUS_C" },
            { titulo: "Método", campo: "METODO" },
            { titulo: "Diâmetro", campo: "DIAMETR_MM" },
            { titulo: "Município", campo: "MUNICIPIO" },
            { titulo: "Bairro", campo: "BAIRRO" },
            { titulo: "Logradouro", campo: "LOGRADOURO" }
        ])
    );
};

window.abrirDetalhesFrentes = function() {
    const frentesTodas = obterFeatures("json_EMN2Frentes_em_Andamento_9");

    const frentes = filtrarContratoModal(frentesTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    abrirModal(
        "Frentes em Campo",
        gerarTabelaModal(frentes, [
            { titulo: "Contrato", campo: "CONTRATO" },
            { titulo: "Frente", campo: "FRENTE" },
            { titulo: "Método", campo: "MÉTODO" },
            { titulo: "Status", campo: "STATUS" },
            { titulo: "Engenheiro", campo: "ENGENHEIRO" },
            { titulo: "Fiscal", campo: "FISCAL" },
            { titulo: "Encarregado", campo: "ENCARREGADO" },
            { titulo: "Equipe", campo: "EQUIPE" },
            { titulo: "Data", campo: "DATA" },
            { titulo: "Endereço", campo: "ENDEREÇO" }
        ])
    );
};

window.abrirDetalhesSinistros = function() {
    const sinistrosTodas = obterFeatures("json_SinistroEMN2_7");

    const sinistros = filtrarContratoModal(sinistrosTodas, [
        "Contrato",
        "CONTRATO",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    abrirModal(
        "Sinistros",
        gerarTabelaModal(sinistros, [
            { titulo: "Contrato", campo: "Contrato" },
            { titulo: "Ficha", campo: "Ficha" },
            { titulo: "Frente", campo: "Frente" },
            { titulo: "Sinistro", campo: "Sinistro" },
            { titulo: "Critério", campo: "Critério" }
        ])
    );
};

window.abrirDetalhesEEE = function() {
    const eeeTodas = obterFeatures("json_EEE_6");

    const eee = filtrarContratoModal(eeeTodas, [
        "CONTRATO",
        "Contrato",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    const avancosEEE = obterAvancosEEE();
    const htmlAvanco = gerarBarrasAvancoEEE(avancosEEE);

    const htmlTabela = `
        <h3 style="color:#0b2f5b;margin-top:24px;">Dados das EEE no mapa</h3>
        ${gerarTabelaModal(eee, [
            { titulo: "Contrato", campo: "CONTRATO" },
            { titulo: "EEE", campo: "EEE" },
            { titulo: "Status", campo: "STATUS" },
            { titulo: "Local", campo: "LOCAL" },
            { titulo: "Endereço", campo: "ENDEREÇO" },
            { titulo: "Município", campo: "MUNICIPIO" },
            { titulo: "Vazão Q", campo: "Q" },
            { titulo: "Operação", campo: "OPERAÇÃO" }
        ])}
    `;

    abrirModal(
        "Elevatórias - EEE",
        htmlAvanco + htmlTabela
    );
};

window.abrirDetalhesLancamentos = function() {
    const lancamentosTodas = obterCamadaPorParteDoNome([
        "PONTOSDELANAMENTO",
        "PONTOS",
        "LANCA",
        "LANCAMENTO",
        "LANÇAMENTO"
    ]);

    const lancamentos = filtrarContratoModal(lancamentosTodas, [
        "Contrato",
        "CONTRATO",
        "contrato",
        "NUM_CONTRA",
        "NUM_CONTRATO"
    ]);

    abrirModal(
        "Pontos de Lançamento",
        gerarTabelaModal(lancamentos, [
            { titulo: "Contrato", campo: "Contrato" },
            { titulo: "Pacote", campo: "Pacote" },
            { titulo: "Nome", campo: "Nome_Lanca" },
            { titulo: "Município", campo: "Municipio" },
            { titulo: "Bacia", campo: "Bacia" },
            { titulo: "Status", campo: "Status" }
        ])
    );
};

function ativarCliquesDosCards() {
    const itens = [
        ["tituloMetasGerais", window.abrirDetalhesMetas],
        ["cardObras", window.abrirDetalhesObras],
        ["cardFrentes", window.abrirDetalhesFrentes],
        ["cardSinistros", window.abrirDetalhesSinistros],
        ["cardEEE", window.abrirDetalhesEEE],
        ["cardLancamentos", window.abrirDetalhesLancamentos]
    ];

    itens.forEach(([id, funcao]) => {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.addEventListener("click", funcao);
        } else {
            console.warn("Elemento clicável não encontrado:", id);
        }
    });
}

/* =========================================================
   CSV ÚNICO DO DASHBOARD
   ========================================================= */

let baseDashboardCSV = [];

async function carregarBaseDashboardCSV() {
    try {
        const caminhos = [
            "dados/base_dashboard_teste.csv",
            "./dados/base_dashboard_teste.csv",
            "/PONTE/dados/base_dashboard_teste.csv"
        ];

        let textoCSV = null;

        for (const caminho of caminhos) {
            try {
                const resposta = await fetch(caminho + "?v=" + Date.now());

                if (resposta.ok) {
                    textoCSV = await resposta.text();
                    console.log("Base CSV carregada em:", caminho);
                    break;
                }
            } catch (erro) {
                console.warn("Falha ao tentar carregar CSV em:", caminho);
            }
        }

        if (!textoCSV) {
            console.warn("CSV não carregado. Mantendo dados do metas.js.");
            return;
        }

        baseDashboardCSV = parseCSVGenerico(textoCSV);

        aplicarCSVNasMetas();
        aplicarCSVNosGraficosContratos();

    } catch (erro) {
        console.error("Erro ao carregar base_dashboard_teste.csv:", erro);
    }
}

function parseCSVGenerico(texto) {
    const linhas = texto
        .replace(/\r/g, "")
        .split("\n")
        .filter(linha => linha.trim() !== "");

    if (linhas.length <= 1) return [];

    const separador = linhas[0].includes(";") ? ";" : ",";

    const cabecalho = dividirLinhaCSVGenerico(linhas[0], separador)
        .map(campo => campo.trim());

    return linhas.slice(1).map(linha => {
        const valores = dividirLinhaCSVGenerico(linha, separador);
        const obj = {};

        cabecalho.forEach((campo, index) => {
            obj[campo] = valores[index] ? valores[index].trim() : "";
        });

        return obj;
    });
}

function dividirLinhaCSVGenerico(linha, separador) {
    const resultado = [];
    let atual = "";
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
        const caractere = linha[i];

        if (caractere === '"') {
            dentroAspas = !dentroAspas;
            continue;
        }

        if (caractere === separador && !dentroAspas) {
            resultado.push(atual);
            atual = "";
            continue;
        }

        atual += caractere;
    }

    resultado.push(atual);

    return resultado;
}

function numeroCSV(valor) {
    let texto = String(valor || "")
        .replace("R$", "")
        .replace(/\s/g, "")
        .trim();

    if (!texto) return 0;

    if (texto.includes(",") && texto.includes(".")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
        texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    return isNaN(numero) ? 0 : numero;
}

function linhasCSVPorTipo(tipo) {
    return baseDashboardCSV.filter(linha =>
        normalizarTexto(linha.tipo) === normalizarTexto(tipo)
    );
}

function buscarMetaCSV(indicador, periodo) {
    return baseDashboardCSV.find(linha =>
        normalizarTexto(linha.tipo) === "META" &&
        normalizarTexto(linha.indicador).includes(normalizarTexto(indicador)) &&
        normalizarTexto(linha.periodo).includes(normalizarTexto(periodo))
    );
}

function aplicarCSVNasMetas() {
    if (!baseDashboardCSV.length) return;

    const ecoFUAtual = buscarMetaCSV("Economias Fator U", "Atual");
    const ecoContratoAtual = buscarMetaCSV("Economias Contrato", "Atual");
    const imobilizadoAtual = buscarMetaCSV("Imobilizado", "Atual");
    const prodIntegraAtual = buscarMetaCSV("Producao Integra", "Atual");
    const prodAndamentoAtual = buscarMetaCSV("Producao Andamento", "Atual");

    const ecoFUProx = buscarMetaCSV("Economias Fator U", "Proximo");
    const ecoContratoProx = buscarMetaCSV("Economias Contrato", "Proximo");
    const imobilizadoProx = buscarMetaCSV("Imobilizado", "Proximo");
    const prodIntegraProx = buscarMetaCSV("Producao Integra", "Proximo");
    const prodAndamentoProx = buscarMetaCSV("Producao Andamento", "Proximo");

    if (ecoFUAtual) {
        metas.economias.fatorU.previsto = numeroCSV(ecoFUAtual.previsto);
        metas.economias.fatorU.realizado = numeroCSV(ecoFUAtual.realizado);
    }

    if (ecoContratoAtual) {
        metas.economias.contrato.previsto = numeroCSV(ecoContratoAtual.previsto);
        metas.economias.contrato.realizado = numeroCSV(ecoContratoAtual.realizado);
    }

    if (imobilizadoAtual) {
        metas.imobilizado.previsto = numeroCSV(imobilizadoAtual.previsto);
        metas.imobilizado.realizado = numeroCSV(imobilizadoAtual.realizado);
    }

    if (prodIntegraAtual) {
        metas.producao.integra.previsto = numeroCSV(prodIntegraAtual.previsto);
        metas.producao.integra.realizado = numeroCSV(prodIntegraAtual.realizado);
    }

    if (prodAndamentoAtual) {
        metas.producao.andamento.previsto = numeroCSV(prodAndamentoAtual.previsto);
        metas.producao.andamento.realizado = numeroCSV(prodAndamentoAtual.realizado);
    }

    if (ecoFUProx) {
        metas.proximoMes.economias.fatorU.previsto = numeroCSV(ecoFUProx.previsto);
        metas.proximoMes.economias.fatorU.realizado = numeroCSV(ecoFUProx.realizado);
    }

    if (ecoContratoProx) {
        metas.proximoMes.economias.contrato.previsto = numeroCSV(ecoContratoProx.previsto);
        metas.proximoMes.economias.contrato.realizado = numeroCSV(ecoContratoProx.realizado);
    }

    if (imobilizadoProx) {
        metas.proximoMes.imobilizado.previsto = numeroCSV(imobilizadoProx.previsto);
        metas.proximoMes.imobilizado.realizado = numeroCSV(imobilizadoProx.realizado);
    }

    if (prodIntegraProx) {
        metas.proximoMes.producao.integra.previsto = numeroCSV(prodIntegraProx.previsto);
        metas.proximoMes.producao.integra.realizado = numeroCSV(prodIntegraProx.realizado);
    }

    if (prodAndamentoProx) {
        metas.proximoMes.producao.andamento.previsto = numeroCSV(prodAndamentoProx.previsto);
        metas.proximoMes.producao.andamento.realizado = numeroCSV(prodAndamentoProx.realizado);
    }
}

function aplicarCSVNosGraficosContratos() {
    if (!baseDashboardCSV.length) return;

    const valores = linhasCSVPorTipo("contrato_valor");
    const extensoes = linhasCSVPorTipo("contrato_extensao");

    if (valores.length) {
        metas.valoresContratos = valores.map(linha => ({
            contrato: linha.contrato,
            valorContratual: numeroCSV(linha.valor_contratual),
            totalPedido: numeroCSV(linha.total_pedido),
            totalUnitizado: numeroCSV(linha.total_unitizado)
        }));
    }

    if (extensoes.length) {
        metas.extensaoContratos = extensoes.map(linha => ({
            contrato: linha.contrato,
            contratual: numeroCSV(linha.ext_contratual),
            atual: numeroCSV(linha.ext_atual),
            executada: numeroCSV(linha.ext_executada),
            unitizada: numeroCSV(linha.ext_unitizada)
        }));
    }
}

function obterAvancosEEE() {
    let avancos = linhasCSVPorTipo("avanco_popup");

    if (contratoSelecionado !== "TODOS") {
        avancos = avancos.filter(linha =>
            String(linha.contrato || "").trim() === contratoSelecionado
        );
    }

    return avancos.map(linha => {
        const valores = Object.values(linha)
            .map(valor => String(valor || "").trim())
            .filter(valor => valor !== "");

        const status = valores[valores.length - 1] || "";
        const avanco = valores[valores.length - 2] || "0";
        const item = valores[valores.length - 3] || "EEE sem nome";

        return {
            contrato: linha.contrato || "",
            item,
            avanco,
            status
        };
    });
}

function gerarBarrasAvancoEEE(avancos) {
    if (!avancos || avancos.length === 0) {
        return `
            <div class="bloco-avanco-eee">
                <h3>Avanço das EEE</h3>
                <p>Nenhum avanço cadastrado no CSV para o filtro atual.</p>
            </div>
        `;
    }

    let html = `
        <div class="bloco-avanco-eee">
            <h3>Avanço das EEE</h3>
            <div class="lista-avanco-eee">
    `;

    avancos.forEach(linha => {
        const nome = linha.item || "EEE sem nome";
        const status = linha.status || "";
        const avancoOriginal = numeroCSV(linha.avanco);

        const avanco = Math.max(0, Math.min(100, avancoOriginal));

        html += `
            <div class="linha-avanco-eee">
                <div class="nome-avanco-eee">${nome}</div>

                <div class="trilho-avanco-eee" title="${nome} - ${avancoOriginal.toFixed(2)}%">
                    <div class="barra-avanco-eee" style="width:${avanco}%"></div>
                </div>

                <div class="valor-avanco-eee">${avancoOriginal.toFixed(2)}%</div>

                <div class="status-avanco-eee">${status}</div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function() {
    await carregarBaseDashboardCSV();

    carregarMetasGerais();
    atualizarDashboard();
    criarGraficosFixos();
    ativarCliquesDosCards();
    atualizarBotaoContratoAtivo();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharModal();
    }
});

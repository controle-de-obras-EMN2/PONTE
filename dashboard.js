function formatarNumero(valor) {
    return valor.toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function percentual(realizado, previsto) {
    if (!previsto || previsto === 0) return 0;
    return (realizado / previsto) * 100;
}

document.addEventListener("DOMContentLoaded", function () {

    const ecoFU = metas.economias.fatorU;
    const ecoContrato = metas.economias.contrato;
    const imob = metas.imobilizado;
    const prodIntegra = metas.producao.integra;

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

    const ctx = document.getElementById("graficoValores");

    new Chart(ctx, {
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
            plugins: {
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

});
function obterFeaturesPorNome(parteDoNome) {
    const variavel = Object.keys(window).find(nome =>
        nome.startsWith("json_") &&
        nome.toLowerCase().includes(parteDoNome.toLowerCase())
    );

    if (!variavel) {
        console.warn("Camada não encontrada contendo:", parteDoNome);
        return [];
    }

    console.log("Camada encontrada:", variavel);

    return window[variavel].features || [];
}
}

function contarPorCampo(features, campo) {
    const contagem = {};

    features.forEach(feature => {
        const valor = feature.properties?.[campo] || "Não informado";
        contagem[valor] = (contagem[valor] || 0) + 1;
    });

    return contagem;
}

function criarGraficoBarra(idCanvas, titulo, dados) {
    const canvas = document.getElementById(idCanvas);

    if (!canvas) return;

    new Chart(canvas, {
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
            plugins: {
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

document.addEventListener("DOMContentLoaded", function () {

const obras = obterFeatures("json_OBRAS_EMN2_4");
const eee = obterFeatures("json_EEE_6");
const sinistros = obterFeatures("json_SinistroEMN2_7");
const viradaMancha = obterFeatures("json_VIRADADEMANCHA_2");
const frentes = obterFeatures("json_EMN2Frentes_em_Andamento_9");

    document.getElementById("totalObras").innerText = obras.length.toLocaleString("pt-BR");
    document.getElementById("totalFrentes").innerText = frentes.length.toLocaleString("pt-BR");
    document.getElementById("totalSinistros").innerText = sinistros.length.toLocaleString("pt-BR");
    document.getElementById("totalEEE").innerText = eee.length.toLocaleString("pt-BR");

    criarGraficoBarra(
        "graficoStatusObras",
        "Obras por Status",
        contarPorCampo(obras, "STATUS_C")
    );

    criarGraficoBarra(
        "graficoMetodo",
        "Obras por Método",
        contarPorCampo(obras, "METODO")
    );

    criarGraficoBarra(
        "graficoDiametro",
        "Obras por Diâmetro",
        contarPorCampo(obras, "DIAMETR_MM")
    );

    criarGraficoBarra(
        "graficoFrentesStatus",
        "Frentes por Status",
        contarPorCampo(frentes, "STATUS")
    );

});

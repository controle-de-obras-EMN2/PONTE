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

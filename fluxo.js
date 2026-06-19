let dadosFluxo = [];

let zoomAtual = 1;
let zoomMinimo = 0.2;
let zoomMaximo = 4;

let larguraNatural = 0;
let alturaNatural = 0;

let arrastando = false;
let inicioX = 0;
let inicioY = 0;
let scrollInicioX = 0;
let scrollInicioY = 0;

document.addEventListener("DOMContentLoaded", function() {
    prepararFluxo();
    carregarFluxoInterativo();
});

function prepararFluxo() {
    const area = document.getElementById("fluxoArea");
    const imagem = document.getElementById("imagemFluxo");

    imagem.addEventListener("load", function() {
        larguraNatural = imagem.naturalWidth;
        alturaNatural = imagem.naturalHeight;

        ajustarZoomInicial();
        aplicarZoom();
        centralizarFluxo();
    });

    area.addEventListener("wheel", aplicarZoomComScroll, { passive: false });

    area.addEventListener("mousedown", iniciarArrasto);
    area.addEventListener("mousemove", moverArrasto);
    area.addEventListener("mouseup", finalizarArrasto);
    area.addEventListener("mouseleave", finalizarArrasto);

    area.addEventListener("dblclick", function() {
        ajustarZoomInicial();
        aplicarZoom();
        centralizarFluxo();
    });
}

function ajustarZoomInicial() {
    const area = document.getElementById("fluxoArea");

    if (!larguraNatural || !alturaNatural) return;

    const margem = 40;

    const escalaLargura = (area.clientWidth - margem) / larguraNatural;
    const escalaAltura = (area.clientHeight - margem) / alturaNatural;

    zoomAtual = Math.min(escalaLargura, escalaAltura);

    if (zoomAtual > 1) {
        zoomAtual = 1;
    }

    if (zoomAtual < zoomMinimo) {
        zoomAtual = zoomMinimo;
    }
}

function aplicarZoom() {
    const canvas = document.getElementById("fluxoCanvas");
    const indicador = document.getElementById("zoomIndicador");

    if (!larguraNatural || !alturaNatural) return;

    canvas.style.width = (larguraNatural * zoomAtual) + "px";
    canvas.style.height = (alturaNatural * zoomAtual) + "px";

    indicador.innerText = Math.round(zoomAtual * 100) + "%";
}

function aplicarZoomComScroll(event) {
    event.preventDefault();

    const area = document.getElementById("fluxoArea");

    const zoomAnterior = zoomAtual;

    const fator = event.deltaY < 0 ? 1.12 : 0.88;

    zoomAtual = zoomAtual * fator;

    if (zoomAtual < zoomMinimo) {
        zoomAtual = zoomMinimo;
    }

    if (zoomAtual > zoomMaximo) {
        zoomAtual = zoomMaximo;
    }

    const rect = area.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const pontoImagemX = (area.scrollLeft + mouseX) / zoomAnterior;
    const pontoImagemY = (area.scrollTop + mouseY) / zoomAnterior;

    aplicarZoom();

    area.scrollLeft = (pontoImagemX * zoomAtual) - mouseX;
    area.scrollTop = (pontoImagemY * zoomAtual) - mouseY;
}

function centralizarFluxo() {
    const area = document.getElementById("fluxoArea");
    const canvas = document.getElementById("fluxoCanvas");

    area.scrollLeft = Math.max(0, (canvas.offsetWidth - area.clientWidth) / 2);
    area.scrollTop = Math.max(0, (canvas.offsetHeight - area.clientHeight) / 2);
}

function iniciarArrasto(event) {
    if (event.target.classList.contains("hotspot")) return;

    const area = document.getElementById("fluxoArea");

    arrastando = true;

    inicioX = event.pageX;
    inicioY = event.pageY;

    scrollInicioX = area.scrollLeft;
    scrollInicioY = area.scrollTop;

    area.classList.add("arrastando");
}

function moverArrasto(event) {
    if (!arrastando) return;

    event.preventDefault();

    const area = document.getElementById("fluxoArea");

    const deslocamentoX = event.pageX - inicioX;
    const deslocamentoY = event.pageY - inicioY;

    area.scrollLeft = scrollInicioX - deslocamentoX;
    area.scrollTop = scrollInicioY - deslocamentoY;
}

function finalizarArrasto() {
    const area = document.getElementById("fluxoArea");

    arrastando = false;

    if (area) {
        area.classList.remove("arrastando");
    }
}


/* =========================================================
   ÁREAS CLICÁVEIS FUTURAS
   ========================================================= */

async function carregarFluxoInterativo() {
    try {
        const texto = await carregarCSVComFallback([
            "dados/fluxo_interativo.csv",
            "./dados/fluxo_interativo.csv",
            "/PONTE/dados/fluxo_interativo.csv"
        ]);

        dadosFluxo = parseCSV(texto);

        desenharHotspots();

    } catch (erro) {
        console.warn("Nenhum CSV de interatividade encontrado. A imagem carregou sem áreas clicáveis.", erro);
        dadosFluxo = [];
    }
}

async function carregarCSVComFallback(caminhos) {
    for (const caminho of caminhos) {
        try {
            const resposta = await fetch(caminho + "?v=" + Date.now());

            if (resposta.ok) {
                console.log("CSV de fluxo carregado em:", caminho);
                return await resposta.text();
            }
        } catch (erro) {
            console.warn("Falha ao tentar carregar:", caminho);
        }
    }

    throw new Error("Não foi possível carregar o CSV de fluxo.");
}

function parseCSV(texto) {
    const linhas = texto
        .replace(/\r/g, "")
        .split("\n")
        .filter(linha => linha.trim() !== "");

    if (linhas.length <= 1) return [];

    const separador = linhas[0].includes(";") ? ";" : ",";

    const cabecalho = linhas[0]
        .split(separador)
        .map(c => c.trim());

    return linhas.slice(1).map(linha => {
        const valores = dividirLinhaCSV(linha, separador);
        const obj = {};

        cabecalho.forEach((campo, index) => {
            obj[campo] = valores[index] ? valores[index].trim() : "";
        });

        return obj;
    });
}

function dividirLinhaCSV(linha, separador) {
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

function desenharHotspots() {
    const canvas = document.getElementById("fluxoCanvas");

    document.querySelectorAll(".hotspot").forEach(item => item.remove());

    dadosFluxo.forEach(item => {
        const hotspot = document.createElement("div");

        hotspot.className = "hotspot";
        hotspot.dataset.id = item.id || "";
        hotspot.dataset.tipo = item.tipo || "";
        hotspot.dataset.nome = item.nome || "";
        hotspot.dataset.contrato = item.contrato || "";

        hotspot.style.left = numeroCSS(item.x) + "%";
        hotspot.style.top = numeroCSS(item.y) + "%";
        hotspot.style.width = numeroCSS(item.largura) + "%";
        hotspot.style.height = numeroCSS(item.altura) + "%";

        hotspot.addEventListener("mouseenter", function(event) {
            mostrarTooltip(event, item);
        });

        hotspot.addEventListener("mousemove", function(event) {
            moverTooltip(event);
        });

        hotspot.addEventListener("mouseleave", function() {
            esconderTooltip();
        });

        hotspot.addEventListener("click", function(event) {
            event.stopPropagation();
            abrirDetalheFluxo(item);
        });

        canvas.appendChild(hotspot);
    });
}

function numeroCSS(valor) {
    const numero = Number(String(valor || "0").replace(",", "."));
    return isNaN(numero) ? 0 : numero;
}

function mostrarTooltip(event, item) {
    const tooltip = document.getElementById("tooltipFluxo");

    tooltip.innerHTML = `
        <strong>${item.nome || "Sem nome"}</strong>
        ${item.tipo ? item.tipo + "<br>" : ""}
        ${item.contrato ? "Contrato: " + item.contrato + "<br>" : ""}
        ${item.economias ? "Economias: " + item.economias + "<br>" : ""}
        ${item.status ? "Status: " + item.status : ""}
    `;

    tooltip.style.display = "block";

    moverTooltip(event);
}

function moverTooltip(event) {
    const tooltip = document.getElementById("tooltipFluxo");

    tooltip.style.left = (event.clientX + 14) + "px";
    tooltip.style.top = (event.clientY + 14) + "px";
}

function esconderTooltip() {
    const tooltip = document.getElementById("tooltipFluxo");
    tooltip.style.display = "none";
}

function abrirDetalheFluxo(item) {
    const titulo = item.nome || "Detalhes do Fluxo";

    const conteudo = `
        <div class="modal-fluxo-info">

            <div>
                <span>Tipo</span>
                <strong>${item.tipo || "-"}</strong>
            </div>

            <div>
                <span>Contrato</span>
                <strong>${item.contrato || "-"}</strong>
            </div>

            <div>
                <span>Status</span>
                <strong>${item.status || "-"}</strong>
            </div>

            <div>
                <span>Economias</span>
                <strong>${item.economias || "-"}</strong>
            </div>

            <div>
                <span>Economias recebidas</span>
                <strong>${item.economias_recebidas || "-"}</strong>
            </div>

            <div>
                <span>Economias liberadas</span>
                <strong>${item.economias_liberadas || "-"}</strong>
            </div>

        </div>

        <h3 style="color:#0b2f5b;">Descrição</h3>
        <p>${item.descricao || "Sem descrição cadastrada."}</p>

        <h3 style="color:#0b2f5b;">Dependência / Interferência</h3>
        <p>${item.dependencia || "Sem dependência cadastrada."}</p>
    `;

    abrirModal(titulo, conteudo);
}


/* =========================================================
   MODAL
   ========================================================= */

window.abrirModal = function(titulo, conteudo) {
    const modal = document.getElementById("modal");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalCorpo = document.getElementById("modalCorpo");

    if (!modal || !modalTitulo || !modalCorpo) {
        console.error("Modal não encontrado.");
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

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharModal();
    }
});

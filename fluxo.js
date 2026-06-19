/* =========================================================
   VISUALIZADOR PDF DO FLUXO - PONTE
   ========================================================= */

const arquivoPDF = "images/fluxograma_pacotes.pdf";

let pdfDocumento = null;
let paginaPDF = null;

let larguraBase = 0;
let alturaBase = 0;

let escalaAtual = 1;
let escalaMinima = 0.15;
let escalaMaxima = 3;

let posicaoX = 0;
let posicaoY = 0;

let arrastando = false;
let inicioMouseX = 0;
let inicioMouseY = 0;
let inicioPosicaoX = 0;
let inicioPosicaoY = 0;

let renderizacaoAtual = null;
let numeroRenderizacao = 0;

document.addEventListener("DOMContentLoaded", function() {
    configurarPDFJS();
    configurarEventos();
    carregarPDF();
});

function configurarPDFJS() {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function configurarEventos() {
    const container = document.getElementById("pdfContainer");

    container.addEventListener("wheel", aplicarZoomComScroll, {
        passive: false
    });

    container.addEventListener("mousedown", iniciarArrasto);
    container.addEventListener("mousemove", moverArrasto);
    container.addEventListener("mouseup", finalizarArrasto);
    container.addEventListener("mouseleave", finalizarArrasto);

    container.addEventListener("dblclick", function() {
        ajustarEscalaInicial();
        centralizarPDF();
        renderizarPagina();
    });

    window.addEventListener("resize", function() {
        ajustarEscalaInicial();
        centralizarPDF();
        renderizarPagina();
    });
}

async function carregarPDF() {
    const carregando = document.getElementById("carregandoPdf");
    const container = document.getElementById("pdfContainer");

    try {
        pdfDocumento = await pdfjsLib.getDocument(arquivoPDF).promise;
        paginaPDF = await pdfDocumento.getPage(1);

        const viewportBase = paginaPDF.getViewport({
            scale: 1
        });

        larguraBase = viewportBase.width;
        alturaBase = viewportBase.height;

        ajustarEscalaInicial();
        centralizarPDF();

        await renderizarPagina();

        if (carregando) {
            carregando.style.display = "none";
        }

    } catch (erro) {
        console.error("Erro ao carregar PDF:", erro);

        if (carregando) {
            carregando.innerHTML = `
                <div class="erro-pdf">
                    Não foi possível carregar o PDF.<br>
                    Confira se o arquivo existe em:<br>
                    images/fluxograma_pacotes.pdf
                </div>
            `;
        }

        container.style.cursor = "default";
    }
}

function ajustarEscalaInicial() {
    const container = document.getElementById("pdfContainer");

    if (!larguraBase || !alturaBase) return;

    const margem = 40;

    const escalaLargura = (container.clientWidth - margem) / larguraBase;
    const escalaAltura = (container.clientHeight - margem) / alturaBase;

    escalaAtual = Math.min(escalaLargura, escalaAltura);

    if (escalaAtual > 1) {
        escalaAtual = 1;
    }

    if (escalaAtual < escalaMinima) {
        escalaAtual = escalaMinima;
    }
}

function centralizarPDF() {
    const container = document.getElementById("pdfContainer");

    const larguraRenderizada = larguraBase * escalaAtual;
    const alturaRenderizada = alturaBase * escalaAtual;

    posicaoX = (container.clientWidth - larguraRenderizada) / 2;
    posicaoY = (container.clientHeight - alturaRenderizada) / 2;
}

async function renderizarPagina() {
    if (!paginaPDF) return;

    const canvas = document.getElementById("pdfCanvas");
    const contexto = canvas.getContext("2d");
    const indicador = document.getElementById("zoomIndicador");

    const numeroDestaRenderizacao = ++numeroRenderizacao;

    if (renderizacaoAtual) {
        try {
            renderizacaoAtual.cancel();
        } catch (erro) {
            // Ignora cancelamento anterior
        }
    }

    const proporcaoTela = window.devicePixelRatio || 1;

    const viewport = paginaPDF.getViewport({
        scale: escalaAtual * proporcaoTela
    });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    canvas.style.width = (viewport.width / proporcaoTela) + "px";
    canvas.style.height = (viewport.height / proporcaoTela) + "px";

    aplicarPosicao();

    renderizacaoAtual = paginaPDF.render({
        canvasContext: contexto,
        viewport: viewport
    });

    try {
        await renderizacaoAtual.promise;

        if (numeroDestaRenderizacao !== numeroRenderizacao) {
            return;
        }

    } catch (erro) {
        if (erro && erro.name !== "RenderingCancelledException") {
            console.warn("Renderização cancelada ou interrompida:", erro);
        }
    }

    if (indicador) {
        indicador.innerText = Math.round(escalaAtual * 100) + "%";
    }
}

function aplicarPosicao() {
    const canvas = document.getElementById("pdfCanvas");

    canvas.style.transform =
        "translate(" + posicaoX + "px, " + posicaoY + "px)";
}

function aplicarZoomComScroll(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!paginaPDF) return;

    const container = document.getElementById("pdfContainer");
    const rect = container.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const escalaAnterior = escalaAtual;

    const fatorZoom = event.deltaY < 0 ? 1.15 : 0.85;

    escalaAtual = escalaAtual * fatorZoom;

    if (escalaAtual < escalaMinima) {
        escalaAtual = escalaMinima;
    }

    if (escalaAtual > escalaMaxima) {
        escalaAtual = escalaMaxima;
    }

    const pontoPDFX = (mouseX - posicaoX) / escalaAnterior;
    const pontoPDFY = (mouseY - posicaoY) / escalaAnterior;

    posicaoX = mouseX - pontoPDFX * escalaAtual;
    posicaoY = mouseY - pontoPDFY * escalaAtual;

    aplicarPosicao();
    renderizarPagina();
}

function iniciarArrasto(event) {
    event.preventDefault();

    const container = document.getElementById("pdfContainer");

    arrastando = true;

    inicioMouseX = event.clientX;
    inicioMouseY = event.clientY;

    inicioPosicaoX = posicaoX;
    inicioPosicaoY = posicaoY;

    container.classList.add("arrastando");
}

function moverArrasto(event) {
    if (!arrastando) return;

    event.preventDefault();

    const deslocamentoX = event.clientX - inicioMouseX;
    const deslocamentoY = event.clientY - inicioMouseY;

    posicaoX = inicioPosicaoX + deslocamentoX;
    posicaoY = inicioPosicaoY + deslocamentoY;

    aplicarPosicao();
}

function finalizarArrasto() {
    const container = document.getElementById("pdfContainer");

    arrastando = false;

    if (container) {
        container.classList.remove("arrastando");
    }
}

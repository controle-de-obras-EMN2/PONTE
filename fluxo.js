let dadosFluxo = [];
let filtroAtual = "TODOS";
let modoCoordenada = false;
let primeiroPonto = null;

document.addEventListener("DOMContentLoaded", function() {
    prepararImagem();
    carregarFluxoInterativo();
    configurarBusca();
});

function prepararImagem() {
    const imagem = document.getElementById("imagemFluxo");

    imagem.addEventListener("load", function() {
        centralizarFluxo();
    });

    imagem.addEventListener("click", function(event) {
        if (!modoCoordenada) return;

        capturarCoordenada(event);
    });
}

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
        console.warn("Nenhum CSV de interatividade encontrado. A imagem continuará funcionando sem áreas clicáveis.", erro);

        dadosFluxo = [];
        desenharHotspots();
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

        hotspot.className = "hotspot tipo-" + limparClasse(item.tipo);
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

    aplicarFiltroVisual();
}

function numeroCSS(valor) {
    const numero = Number(String(valor || "0").replace(",", "."));
    return isNaN(numero) ? 0 : numero;
}

function limparClasse(texto) {
    return String(texto || "Geral")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "");
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

function configurarBusca() {
    const input = document.getElementById("buscaFluxo");

    input.addEventListener("input", function() {
        aplicarFiltroVisual();
    });
}

function filtrarFluxo(tipo, botao) {
    filtroAtual = tipo;

    document.querySelectorAll(".fluxo-filtros button").forEach(btn => {
        btn.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    }

    aplicarFiltroVisual();
}

function aplicarFiltroVisual() {
    const busca = normalizarTexto(document.getElementById("buscaFluxo").value);

    document.querySelectorAll(".hotspot").forEach(hotspot => {
        const tipo = hotspot.dataset.tipo || "";
        const texto = normalizarTexto(
            hotspot.dataset.nome + " " +
            hotspot.dataset.contrato + " " +
            hotspot.dataset.tipo
        );

        let visivel = true;

        if (filtroAtual !== "TODOS" && normalizarTexto(tipo) !== normalizarTexto(filtroAtual)) {
            visivel = false;
        }

        if (busca && !texto.includes(busca)) {
            visivel = false;
        }

        hotspot.classList.toggle("oculto", !visivel);
        hotspot.classList.toggle("destacado", busca && texto.includes(busca));
    });
}

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

function centralizarFluxo() {
    const area = document.getElementById("fluxoArea");

    area.scrollLeft = 0;
    area.scrollTop = 0;
}

function alternarModoCoordenada() {
    modoCoordenada = !modoCoordenada;
    primeiroPonto = null;

    if (modoCoordenada) {
        alert("Modo coordenada ativado.\n\nClique primeiro no canto superior esquerdo da área.\nDepois clique no canto inferior direito.");
    } else {
        alert("Modo coordenada desativado.");
    }
}

function capturarCoordenada(event) {
    const imagem = document.getElementById("imagemFluxo");
    const rect = imagem.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const ponto = {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2))
    };

    if (!primeiroPonto) {
        primeiroPonto = ponto;

        alert(
            "Primeiro ponto capturado:\n" +
            "x: " + ponto.x + "\n" +
            "y: " + ponto.y + "\n\n" +
            "Agora clique no canto inferior direito da área."
        );

        return;
    }

    const x1 = Math.min(primeiroPonto.x, ponto.x);
    const y1 = Math.min(primeiroPonto.y, ponto.y);
    const x2 = Math.max(primeiroPonto.x, ponto.x);
    const y2 = Math.max(primeiroPonto.y, ponto.y);

    const largura = Number((x2 - x1).toFixed(2));
    const altura = Number((y2 - y1).toFixed(2));

    const linhaCSV =
        "id;tipo;nome;contrato;x;y;largura;altura;economias;economias_recebidas;economias_liberadas;status;descricao;dependencia\n" +
        "novo_item;Contrato;Nome do item;;" +
        x1.toFixed(2) + ";" +
        y1.toFixed(2) + ";" +
        largura.toFixed(2) + ";" +
        altura.toFixed(2) + ";" +
        "0;0;0;Status;Descricao;Dependencia";

    console.log("Linha para o CSV:");
    console.log(linhaCSV);

    navigator.clipboard.writeText(linhaCSV).then(() => {
        alert(
            "Área capturada e copiada.\n\n" +
            "Cole a segunda linha no arquivo dados/fluxo_interativo.csv.\n\n" +
            "Também deixei no console do navegador."
        );
    }).catch(() => {
        alert(
            "Área capturada.\n\n" +
            "Abra o console para copiar a linha do CSV."
        );
    });

    primeiroPonto = null;
}

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharModal();
    }
});

/* =========================================================
   FLUXO PONTE
   Lê dados/fluxo.csv e desenha o fluxograma interativo
   ========================================================= */

let fluxoNodes = [];
let fluxoLinks = [];
let fluxoFiltroAtual = "TODOS";
let fluxoBuscaAtual = "";
let fluxoNodePorId = {};

function normalizarFluxo(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

function numeroFluxo(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;

    let texto = String(valor).trim();

    if (texto.includes(",") && texto.includes(".")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
        texto = texto.replace(",", ".");
    }

    return Number(texto) || 0;
}

function formatarFluxo(valor) {
    return Number(valor || 0).toLocaleString("pt-BR");
}

function parseCSVFluxo(texto, separador = ";") {
    texto = texto.replace(/^\uFEFF/, "");

    const linhas = [];
    let linha = [];
    let campo = "";
    let dentroAspas = false;

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        const prox = texto[i + 1];

        if (char === '"') {
            if (dentroAspas && prox === '"') {
                campo += '"';
                i++;
            } else {
                dentroAspas = !dentroAspas;
            }
        } else if (char === separador && !dentroAspas) {
            linha.push(campo);
            campo = "";
        } else if ((char === "\n" || char === "\r") && !dentroAspas) {
            if (char === "\r" && prox === "\n") i++;

            linha.push(campo);
            campo = "";

            if (linha.some(item => String(item).trim() !== "")) {
                linhas.push(linha);
            }

            linha = [];
        } else {
            campo += char;
        }
    }

    if (campo.length || linha.length) {
        linha.push(campo);
        if (linha.some(item => String(item).trim() !== "")) {
            linhas.push(linha);
        }
    }

    const cabecalho = linhas.shift().map(item => item.trim());

    return linhas.map(linhaAtual => {
        const obj = {};

        cabecalho.forEach((campoCabecalho, indice) => {
            obj[campoCabecalho] = (linhaAtual[indice] || "").trim();
        });

        return obj;
    });
}

async function carregarFluxo() {
    try {
        const resposta = await fetch("dados/fluxo.csv", { cache: "no-store" });

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar dados/fluxo.csv");
        }

        const texto = await resposta.text();
        const linhas = parseCSVFluxo(texto, ";");

        fluxoNodes = linhas
            .filter(item => item.tipo === "node")
            .map(item => ({
                ...item,
                x: numeroFluxo(item.x),
                y: numeroFluxo(item.y),
                meta_2025_num: numeroFluxo(item.meta_2025),
                meta_2026_num: numeroFluxo(item.meta_2026),
                economias_recebidas_num: numeroFluxo(item.economias_recebidas),
                economias_liberadas_num: numeroFluxo(item.economias_liberadas),
                extensao_km_num: numeroFluxo(item.extensao_km)
            }));

        fluxoLinks = linhas.filter(item => item.tipo === "link");

        fluxoNodePorId = {};
        fluxoNodes.forEach(node => {
            fluxoNodePorId[node.id] = node;
        });

        calcularEconomiasRecebidasPorLigacao();
        desenharFluxo();
        ativarEventosFluxo();

    } catch (erro) {
        console.error(erro);

        const container = document.getElementById("fluxoContainer");
        if (container) {
            container.innerHTML = `
                <div class="erro-fluxo">
                    <h2>Não foi possível carregar o fluxo</h2>
                    <p>Confira se o arquivo <strong>dados/fluxo.csv</strong> existe no repositório.</p>
                </div>
            `;
        }
    }
}

function calcularEconomiasRecebidasPorLigacao() {
    fluxoLinks.forEach(link => {
        const origem = fluxoNodePorId[link.origem];
        const destino = fluxoNodePorId[link.destino];

        if (!origem || !destino) return;

        const valorOrigem = origem.economias_liberadas_num || origem.meta_2026_num || origem.meta_2025_num || 0;

        if (!destino.economias_recebidas_num) {
            destino.economias_recebidas_num = 0;
        }

        destino.economias_recebidas_num += valorOrigem;
    });
}

function corCategoria(categoria) {
    const cores = {
        contrato: { fill: "#eaf2ff", stroke: "#0b2f5b" },
        elevatoria: { fill: "#fff4d6", stroke: "#b77900" },
        coletor: { fill: "#e8f5e9", stroke: "#2e7d32" },
        linha_recalque: { fill: "#f3e8ff", stroke: "#6d28d9" },
        existente: { fill: "#eeeeee", stroke: "#555555" },
        ete: { fill: "#e0f7fa", stroke: "#00838f" },
        ponto_critico: { fill: "#fde2e2", stroke: "#c62828" },
        outro: { fill: "#ffffff", stroke: "#777777" }
    };

    return cores[categoria] || cores.outro;
}

function tamanhoNode(node) {
    if (node.categoria === "contrato") return { w: 300, h: 120 };
    if (node.categoria === "elevatoria") return { w: 230, h: 82 };
    if (node.categoria === "ponto_critico") return { w: 150, h: 52 };
    if (node.categoria === "ete") return { w: 170, h: 58 };
    return { w: 180, h: 58 };
}

function quebraTexto(texto, limite) {
    const palavras = String(texto || "").split(/\s+/);
    const linhas = [];
    let linha = "";

    palavras.forEach(palavra => {
        const teste = linha ? linha + " " + palavra : palavra;

        if (teste.length > limite && linha) {
            linhas.push(linha);
            linha = palavra;
        } else {
            linha = teste;
        }
    });

    if (linha) linhas.push(linha);

    return linhas.slice(0, 4);
}

function nodeVisivel(node) {
    const filtroOk = fluxoFiltroAtual === "TODOS" || node.categoria === fluxoFiltroAtual;
    const busca = normalizarFluxo(fluxoBuscaAtual);

    if (!busca) return filtroOk;

    const textoBusca = normalizarFluxo([
        node.nome,
        node.categoria,
        node.contrato,
        node.descricao,
        node.metodo,
        node.status
    ].join(" "));

    return filtroOk && textoBusca.includes(busca);
}

function desenharFluxo() {
    const svg = document.getElementById("fluxoSvg");
    if (!svg) return;

    svg.innerHTML = "";

    const nodesVisiveis = fluxoNodes.filter(nodeVisivel);
    const idsVisiveis = new Set(nodesVisiveis.map(node => node.id));
    const linksVisiveis = fluxoLinks.filter(link =>
        idsVisiveis.has(link.origem) && idsVisiveis.has(link.destino)
    );

    const minX = Math.min(...fluxoNodes.map(n => n.x));
    const minY = Math.min(...fluxoNodes.map(n => n.y));
    const maxX = Math.max(...fluxoNodes.map(n => n.x));
    const maxY = Math.max(...fluxoNodes.map(n => n.y));

    const escalaX = 58;
    const escalaY = 32;
    const margem = 80;

    const largura = Math.max(1800, (maxX - minX) * escalaX + margem * 2 + 320);
    const altura = Math.max(1200, (maxY - minY) * escalaY + margem * 2 + 180);

    svg.setAttribute("width", largura);
    svg.setAttribute("height", altura);
    svg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <marker id="setaFluxo" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#54616f"></path>
        </marker>
    `;
    svg.appendChild(defs);

    const grupoLinks = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grupoLinks.setAttribute("class", "fluxo-links");
    svg.appendChild(grupoLinks);

    const grupoNodes = document.createElementNS("http://www.w3.org/2000/svg", "g");
    grupoNodes.setAttribute("class", "fluxo-nodes");
    svg.appendChild(grupoNodes);

    const posicoes = {};

    fluxoNodes.forEach(node => {
        const tamanho = tamanhoNode(node);
        const x = margem + (node.x - minX) * escalaX;
        const y = margem + (node.y - minY) * escalaY;

        posicoes[node.id] = {
            x,
            y,
            cx: x + tamanho.w / 2,
            cy: y + tamanho.h / 2,
            ...tamanho
        };
    });

    linksVisiveis.forEach(link => {
        const origem = posicoes[link.origem];
        const destino = posicoes[link.destino];

        if (!origem || !destino) return;

        const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linha.setAttribute("x1", origem.cx);
        linha.setAttribute("y1", origem.cy);
        linha.setAttribute("x2", destino.cx);
        linha.setAttribute("y2", destino.cy);
        linha.setAttribute("class", "fluxo-link");
        linha.setAttribute("marker-end", "url(#setaFluxo)");

        linha.addEventListener("click", () => abrirDetalhesLink(link));

        grupoLinks.appendChild(linha);
    });

    nodesVisiveis.forEach(node => {
        const pos = posicoes[node.id];
        const cores = corCategoria(node.categoria);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        g.setAttribute("class", "fluxo-node");
        g.setAttribute("data-categoria", node.categoria);
        g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", pos.w);
        rect.setAttribute("height", pos.h);
        rect.setAttribute("rx", 12);
        rect.setAttribute("fill", cores.fill);
        rect.setAttribute("stroke", cores.stroke);
        rect.setAttribute("stroke-width", 3);

        g.appendChild(rect);

        const linhasNome = quebraTexto(node.nome, node.categoria === "contrato" ? 30 : 22);

        linhasNome.forEach((linhaTexto, i) => {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", 14);
            text.setAttribute("y", 24 + i * 16);
            text.setAttribute("class", "fluxo-node-texto");
            text.textContent = linhaTexto;
            g.appendChild(text);
        });

        const resumo = montarResumoNode(node);

        if (resumo) {
            const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
            sub.setAttribute("x", 14);
            sub.setAttribute("y", pos.h - 12);
            sub.setAttribute("class", "fluxo-node-subtexto");
            sub.textContent = resumo;
            g.appendChild(sub);
        }

        g.addEventListener("mousemove", event => mostrarTooltipFluxo(event, node));
        g.addEventListener("mouseleave", esconderTooltipFluxo);
        g.addEventListener("click", () => abrirDetalhesNode(node));

        grupoNodes.appendChild(g);
    });
}

function montarResumoNode(node) {
    if (node.categoria === "contrato") {
        const meta = node.meta_2026_num || node.meta_2025_num;
        const ano = node.meta_2026_num ? "2026" : "2025";

        if (meta) return `${formatarFluxo(meta)} ECO - ${ano}`;
        if (node.extensao_km) return `${node.extensao_km} km`;
    }

    if (node.categoria === "elevatoria") {
        if (node.economias_recebidas_num) {
            return `${formatarFluxo(node.economias_recebidas_num)} ECO recebidas`;
        }

        if (node.vazao_ls) return `Q=${node.vazao_ls}`;
    }

    if (node.categoria === "ponto_critico") return "Interferência";

    return "";
}

function htmlDetalhesNode(node) {
    return `
        <div class="detalhes-fluxo">
            <div class="detalhe-linha"><strong>Nome:</strong><span>${node.nome || "-"}</span></div>
            <div class="detalhe-linha"><strong>Categoria:</strong><span>${node.categoria || "-"}</span></div>
            <div class="detalhe-linha"><strong>Contrato:</strong><span>${node.contrato || "-"}</span></div>
            <div class="detalhe-linha"><strong>Meta 2025:</strong><span>${node.meta_2025_num ? formatarFluxo(node.meta_2025_num) + " economias" : "-"}</span></div>
            <div class="detalhe-linha"><strong>Meta 2026:</strong><span>${node.meta_2026_num ? formatarFluxo(node.meta_2026_num) + " economias" : "-"}</span></div>
            <div class="detalhe-linha"><strong>Economias recebidas:</strong><span>${node.economias_recebidas_num ? formatarFluxo(node.economias_recebidas_num) + " economias" : "-"}</span></div>
            <div class="detalhe-linha"><strong>Economias liberadas:</strong><span>${node.economias_liberadas_num ? formatarFluxo(node.economias_liberadas_num) + " economias" : "-"}</span></div>
            <div class="detalhe-linha"><strong>Extensão:</strong><span>${node.extensao_km ? node.extensao_km + " km" : "-"}</span></div>
            <div class="detalhe-linha"><strong>Método:</strong><span>${node.metodo || "-"}</span></div>
            <div class="detalhe-linha"><strong>Vazão:</strong><span>${node.vazao_ls || "-"}</span></div>
            <div class="detalhe-linha"><strong>Status:</strong><span>${node.status || "-"}</span></div>
            <div class="detalhe-linha"><strong>Observação:</strong><span>${node.descricao || "-"}</span></div>
        </div>
    `;
}

function abrirDetalhesNode(node) {
    abrirModal(`Fluxo - ${node.nome}`, htmlDetalhesNode(node));
}

function abrirDetalhesLink(link) {
    const origem = fluxoNodePorId[link.origem];
    const destino = fluxoNodePorId[link.destino];

    abrirModal(
        "Conexão do Fluxo",
        `
        <div class="detalhes-fluxo">
            <div class="detalhe-linha"><strong>Origem:</strong><span>${origem ? origem.nome : link.origem}</span></div>
            <div class="detalhe-linha"><strong>Destino:</strong><span>${destino ? destino.nome : link.destino}</span></div>
            <div class="detalhe-linha"><strong>Descrição:</strong><span>${link.descricao || "Conexão extraída do fluxograma"}</span></div>
        </div>
        `
    );
}

function mostrarTooltipFluxo(event, node) {
    const tooltip = document.getElementById("tooltipFluxo");
    const container = document.getElementById("fluxoContainer");

    if (!tooltip || !container) return;

    tooltip.innerHTML = `
        <strong>${node.nome}</strong><br>
        ${node.categoria ? "Tipo: " + node.categoria + "<br>" : ""}
        ${node.meta_2026_num ? "Meta 2026: " + formatarFluxo(node.meta_2026_num) + " ECO<br>" : ""}
        ${node.meta_2025_num ? "Meta 2025: " + formatarFluxo(node.meta_2025_num) + " ECO<br>" : ""}
        ${node.economias_recebidas_num ? "Recebe: " + formatarFluxo(node.economias_recebidas_num) + " ECO<br>" : ""}
        ${node.extensao_km ? "Extensão: " + node.extensao_km + " km<br>" : ""}
        ${node.metodo ? "Método: " + node.metodo + "<br>" : ""}
        <em>Clique para detalhes</em>
    `;

    const rect = container.getBoundingClientRect();
    tooltip.style.left = event.clientX - rect.left + 18 + "px";
    tooltip.style.top = event.clientY - rect.top + 18 + "px";
    tooltip.style.display = "block";
}

function esconderTooltipFluxo() {
    const tooltip = document.getElementById("tooltipFluxo");
    if (tooltip) tooltip.style.display = "none";
}

function ativarEventosFluxo() {
    const busca = document.getElementById("buscaFluxo");

    if (busca) {
        busca.addEventListener("input", function() {
            fluxoBuscaAtual = this.value;
            desenharFluxo();
        });
    }

    document.querySelectorAll(".fluxo-legenda button").forEach(botao => {
        botao.addEventListener("click", function() {
            document.querySelectorAll(".fluxo-legenda button").forEach(btn => btn.classList.remove("ativo"));
            this.classList.add("ativo");

            fluxoFiltroAtual = this.dataset.filtro;
            desenharFluxo();
        });
    });
}

window.centralizarFluxo = function() {
    const container = document.getElementById("fluxoContainer");
    if (!container) return;

    container.scrollLeft = 0;
    container.scrollTop = 0;
};

window.abrirModal = function(titulo, conteudo) {
    const modal = document.getElementById("modal");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalCorpo = document.getElementById("modalCorpo");

    if (!modal || !modalTitulo || !modalCorpo) return;

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
    if (event.key === "Escape") fecharModal();
});

document.addEventListener("DOMContentLoaded", carregarFluxo);

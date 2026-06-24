function limparCamadasDoMapa() {
    const contexto = obterMapaQgis2web();

    if (!contexto) {
        alert("Não consegui acessar o mapa para limpar as camadas.");
        return;
    }

    const map = contexto.map;
    const ol = contexto.ol;

    let desligadas = 0;

    map.getLayers().forEach(function(layer) {
        desligadas += desligarLayerRecursivo(layer);
    });

    map.render();

    console.log("Camadas desligadas:", desligadas);

    if (desligadas === 0) {
        alert("Nenhuma camada foi desligada. Vou precisar conferir os nomes das camadas no console.");
        listarCamadasDoMapa();
    }
}

function desligarLayerRecursivo(layer) {
    let total = 0;

    if (layer.getLayers) {
        layer.getLayers().forEach(function(subLayer) {
            total += desligarLayerRecursivo(subLayer);
        });

        return total;
    }

    const titulo = String(
        layer.get("title") ||
        layer.get("name") ||
        ""
    ).toLowerCase();

    const ehCamadaBase =
        titulo.includes("google") ||
        titulo.includes("satellite") ||
        titulo.includes("osm") ||
        titulo.includes("openstreetmap") ||
        titulo.includes("bing") ||
        titulo.includes("base") ||
        titulo.includes("mapa base");

    if (!ehCamadaBase && layer.setVisible) {
        layer.setVisible(false);
        layer.changed();
        total++;
    }

    return total;
}

function listarCamadasDoMapa() {
    const contexto = obterMapaQgis2web();

    if (!contexto) return;

    const map = contexto.map;

    console.log("Lista de camadas encontradas:");

    map.getLayers().forEach(function(layer, index) {
        listarLayerRecursivo(layer, index);
    });
}

function listarLayerRecursivo(layer, index) {
    if (layer.getLayers) {
        layer.getLayers().forEach(function(subLayer, subIndex) {
            listarLayerRecursivo(subLayer, index + "." + subIndex);
        });

        return;
    }

    console.log({
        indice: index,
        titulo: layer.get("title"),
        nome: layer.get("name"),
        visivel: layer.getVisible ? layer.getVisible() : null,
        source: layer.getSource ? layer.getSource()?.constructor?.name : null
    });
}

function ativarBotaoLimparCamadas() {
    const botao = document.getElementById("btnLimparCamadas");

    if (!botao) {
        console.warn("Botão btnLimparCamadas não encontrado.");
        return;
    }

    botao.addEventListener("click", function() {
        console.log("Clique recebido no botão Limpar camadas");
        limparCamadasDoMapa();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ativarBotaoLimparCamadas);
} else {
    ativarBotaoLimparCamadas();
}

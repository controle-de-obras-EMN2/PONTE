function limparCamadasDoMapa() {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe || !iframe.contentDocument) {
        alert("Não consegui acessar o iframe do mapa.");
        return;
    }

    const documentoMapa = iframe.contentDocument;

    const checkboxesMarcados = documentoMapa.querySelectorAll(
        "input[type='checkbox']:checked"
    );

    let total = 0;

    checkboxesMarcados.forEach(function(checkbox) {
        checkbox.click();
        total++;
    });

    console.log("Camadas desmarcadas:", total);

    if (total === 0) {
        alert("Nenhuma camada marcada foi encontrada para limpar.");
    }
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

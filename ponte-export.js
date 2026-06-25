/* =========================================================
   PONTE EXPORT / CONTROLE DO MAPA
   Botões externos ao qgis2web
   ========================================================= */

console.log("ponte-export.js carregado");


/* =========================================================
   INICIALIZAÇÃO DOS BOTÕES
   ========================================================= */

function iniciarFerramentasPonte() {
    ativarBotaoExportarKMZ();
    ativarBotaoLimparCamadas();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarFerramentasPonte);
} else {
    iniciarFerramentasPonte();
}


/* =========================================================
   ACESSO AO MAPA DO QGIS2WEB
   ========================================================= */

function obterMapaQgis2web() {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe) {
        alert("Iframe do mapa não encontrado. Confira se ele tem id='iframeMapa'.");
        return null;
    }

    const janelaMapa = iframe.contentWindow;

    if (!janelaMapa) {
        alert("Não consegui acessar a janela do mapa.");
        return null;
    }

    const map = janelaMapa.map || janelaMapa.ponteMap;
    const ol = janelaMapa.ol || janelaMapa.ponteOl;

    if (!map) {
        alert("Ainda não consegui acessar o objeto do mapa. Aguarde o mapa carregar totalmente e tente novamente.");
        return null;
    }

    if (!ol) {
        alert("A biblioteca OpenLayers não está acessível no mapa.");
        return null;
    }

    return {
        map,
        ol,
        janelaMapa
    };
}


/* =========================================================
   EXPORTAR KMZ
   ========================================================= */

function ativarBotaoExportarKMZ() {
    const botao = document.getElementById("btnExportarKMZ");

    if (!botao) {
        console.warn("Botão btnExportarKMZ não encontrado.");
        return;
    }

    botao.addEventListener("click", function() {
        console.log("Clique recebido no botão Exportar KMZ");
        exportarVisualizacaoKMZ();
    });
}

function obterCamadasVisiveis(layerGroup, resultado = []) {
    layerGroup.getLayers().forEach(function(layer) {
        if (layer.getLayers) {
            obterCamadasVisiveis(layer, resultado);
            return;
        }

        if (layer.getVisible && layer.getVisible()) {
            resultado.push(layer);
        }
    });

    return resultado;
}

function obterFeaturesVisiveisNoMapa(map, ol) {
    const extentAtual = map.getView().calculateExtent(map.getSize());
    const resolution = map.getView().getResolution();
    const camadas = obterCamadasVisiveis(map);

    let resultado = [];

    camadas.forEach(function(layer) {
        const source = layer.getSource ? layer.getSource() : null;

        if (!source || !source.getFeatures) return;

        const nomeCamada =
            layer.get("title") ||
            layer.get("name") ||
            "Camada sem nome";

        const styleFunction = layer.getStyleFunction
            ? layer.getStyleFunction()
            : null;

        source.getFeatures().forEach(function(feature) {
            const geometria = feature.getGeometry();

            if (!geometria) return;

            if (!ol.extent.intersects(extentAtual, geometria.getExtent())) return;

            const copia = feature.clone();

            const nomeFeicao = obterNomeFeicao(feature, nomeCamada);

            copia.set("name", nomeFeicao);
            copia.set("Nome", nomeFeicao);
            copia.set("Camada", nomeCamada);

            if (styleFunction) {
                const estilo = styleFunction(feature, resolution);

                if (estilo) {
                    copia.setStyle(estilo);
                }
            }

            resultado.push(copia);
        });
    });

    return resultado;
}

function obterNomeFeicao(feature, nomeCamada) {
    const props = feature.getProperties();

    const camposPreferidos = [
        "NOME",
        "Nome",
        "nome",
        "EEE",
        "FRENTE",
        "Frente",
        "frente",
        "Nome_Lanca",
        "NUM_CONTRA",
        "CONTRATO",
        "Contrato",
        "STATUS",
        "STATUS_C",
        "Status"
    ];

    for (const campo of camposPreferidos) {
        if (
            props[campo] !== undefined &&
            props[campo] !== null &&
            String(props[campo]).trim() !== ""
        ) {
            return nomeCamada + " - " + String(props[campo]).trim();
        }
    }

    return nomeCamada;
}

async function exportarVisualizacaoKMZ() {
    const contexto = obterMapaQgis2web();

    if (!contexto) return;

    const map = contexto.map;
    const ol = contexto.ol;

    const features = obterFeaturesVisiveisNoMapa(map, ol);

    console.log("Feições encontradas para exportar:", features.length);

    if (!features.length) {
        alert("Nenhuma feição visível para exportar.");
        return;
    }

    if (typeof JSZip === "undefined") {
        alert("JSZip não foi carregado. Confira o script do JSZip no index.html principal.");
        return;
    }

    const formatoKML = new ol.format.KML({
        extractStyles: false,
        writeStyles: true
    });

    const kml = formatoKML.writeFeatures(features, {
        featureProjection: map.getView().getProjection(),
        dataProjection: "EPSG:4326"
    });

    const zip = new JSZip();
    zip.file("doc.kml", kml);

    const conteudo = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.google-earth.kmz"
    });

    const url = URL.createObjectURL(conteudo);
    const link = document.createElement("a");

    link.href = url;
    link.download = "visualizacao_ponte.kmz";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


/* =========================================================
   LIMPAR CAMADAS VIA BRIDGE INTERNO DO MAPA
   ========================================================= */

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

function prepararBridgeDoMapa(callback) {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe || !iframe.contentDocument || !iframe.contentWindow) {
        alert("Não consegui acessar o iframe do mapa.");
        return;
    }

    const janelaMapa = iframe.contentWindow;

    if (janelaMapa.PONTE_MAP_BRIDGE) {
        if (callback) callback();
        return;
    }

    const documentoMapa = iframe.contentDocument;

    if (documentoMapa.getElementById("ponte-map-bridge")) {
        setTimeout(function() {
            if (callback) callback();
        }, 700);

        return;
    }

    const script = documentoMapa.createElement("script");

    script.id = "ponte-map-bridge";
    script.src = "../ponte-map-bridge.js?v=" + Date.now();

    script.onload = function() {
        console.log("Bridge do mapa carregado.");
        if (callback) callback();
    };

    script.onerror = function() {
        alert("Não foi possível carregar o ponte-map-bridge.js dentro do mapa.");
    };

    documentoMapa.body.appendChild(script);
}

function limparCamadasDoMapa() {
    prepararBridgeDoMapa(function() {
        const iframe = document.getElementById("iframeMapa");
        const janelaMapa = iframe.contentWindow;

        if (!janelaMapa.PONTE_MAP_BRIDGE) {
            alert("Bridge do mapa ainda não ficou disponível. Tente novamente em alguns segundos.");
            return;
        }

        const total = janelaMapa.PONTE_MAP_BRIDGE.limparCamadas();

        console.log("Resultado do limpar camadas:", total);

        if (total === 0) {
            console.warn("Nenhuma camada foi desligada. Listando camadas:");
            janelaMapa.PONTE_MAP_BRIDGE.listarCamadas();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ativarBotaoLimparCamadas);
} else {
    ativarBotaoLimparCamadas();
}

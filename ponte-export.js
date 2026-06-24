console.log("ponte-export.js carregado");

function iniciarExportadorKMZ() {
    const botao = document.getElementById("btnExportarKMZ");
    const iframe = document.getElementById("iframeMapa");

    if (!botao) {
        console.error("Botão btnExportarKMZ não encontrado.");
        return;
    }

    if (!iframe) {
        console.error("Iframe iframeMapa não encontrado.");
        return;
    }

    botao.addEventListener("click", function() {
        console.log("Clique recebido no botão Exportar KMZ");
        exportarVisualizacaoKMZ();
    });

    iframe.addEventListener("load", function() {
        console.log("Iframe do mapa carregado.");
        setTimeout(criarPonteComMapaQgis2web, 1000);
    });

    setTimeout(criarPonteComMapaQgis2web, 1500);
}

function criarPonteComMapaQgis2web() {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe || !iframe.contentDocument) {
        console.warn("Ainda não consegui acessar o documento do iframe.");
        return;
    }

    const script = iframe.contentDocument.createElement("script");

    script.textContent =
        "try {" +
        " if (typeof map !== 'undefined') { window.ponteMap = map; }" +
        " if (typeof ol !== 'undefined') { window.ponteOl = ol; }" +
        " console.log('Ponte qgis2web criada:', !!window.ponteMap, !!window.ponteOl);" +
        "} catch (erro) {" +
        " console.error('Erro ao criar ponte qgis2web:', erro);" +
        "}";

    iframe.contentDocument.body.appendChild(script);
}

function obterMapaQgis2web() {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe) {
        alert("Iframe do mapa não encontrado.");
        return null;
    }

    const janelaMapa = iframe.contentWindow;

    if (!janelaMapa) {
        alert("Não consegui acessar a janela do mapa.");
        return null;
    }

    const map = janelaMapa.ponteMap || janelaMapa.map;
    const ol = janelaMapa.ponteOl || janelaMapa.ol;

    if (!map) {
        criarPonteComMapaQgis2web();
        alert("Ainda não consegui acessar o objeto do mapa. Aguarde o mapa carregar totalmente e tente novamente.");
        return null;
    }

    if (!ol) {
        alert("A biblioteca OpenLayers não está acessível.");
        return null;
    }

    return { map, ol };
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
    const camadas = obterCamadasVisiveis(map);

    let features = [];

    camadas.forEach(function(layer) {
        const source = layer.getSource ? layer.getSource() : null;

        if (!source || !source.getFeatures) return;

        source.getFeatures().forEach(function(feature) {
            const geometria = feature.getGeometry();

            if (!geometria) return;

            if (ol.extent.intersects(extentAtual, geometria.getExtent())) {
                features.push(feature);
            }
        });
    });

    return features;
}

async function exportarVisualizacaoKMZ() {
    const contexto = obterMapaQgis2web();

    if (!contexto) return;

    const map = contexto.map;
    const ol = contexto.ol;

    const features = obterFeaturesVisiveisNoMapa(map, ol);

    console.log("Feições encontradas:", features.length);

    if (!features.length) {
        alert("Nenhuma feição visível para exportar.");
        return;
    }

    if (typeof JSZip === "undefined") {
        alert("JSZip não foi carregado no index.html principal.");
        return;
    }

    const formatoKML = new ol.format.KML({
        extractStyles: false,
        writeStyles: false
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

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarExportadorKMZ);
} else {
    iniciarExportadorKMZ();
}

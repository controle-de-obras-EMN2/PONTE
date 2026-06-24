document.addEventListener("DOMContentLoaded", function() {
    const botao = document.getElementById("btnExportarKMZ");

    if (!botao) {
        console.error("Botão btnExportarKMZ não encontrado.");
        return;
    }

    botao.addEventListener("click", exportarVisualizacaoKMZ);
});

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

    if (!janelaMapa.map) {
        alert("O mapa ainda não carregou ou a variável 'map' não está acessível.");
        console.log("Janela do iframe:", janelaMapa);
        return null;
    }

    if (!janelaMapa.ol) {
        alert("A biblioteca OpenLayers 'ol' não está acessível no iframe.");
        return null;
    }

    return {
        map: janelaMapa.map,
        ol: janelaMapa.ol
    };
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

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

function obterFeaturesVisiveisNoMapa() {
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
    const features = obterFeaturesVisiveisNoMapa();

    if (!features.length) {
        alert("Nenhuma feição visível para exportar.");
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

document.getElementById("btnExportarKMZ").addEventListener("click", exportarVisualizacaoKMZ);

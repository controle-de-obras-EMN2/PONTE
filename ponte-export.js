/* =========================================================
   PONTE EXPORT / CONTROLE DO MAPA
   ========================================================= */

console.log("ponte-export.js carregado");

document.addEventListener("click", function(event) {
    const botao = event.target.closest("#btnExportarKMZ");
    if (!botao) return;

    event.preventDefault();
    console.log("Clique recebido no botão Exportar KMZ");
    exportarVisualizacaoKMZ();
});

function obterMapaQgis2web() {
    const iframe = document.getElementById("iframeMapa");
    if (!iframe) {
        alert("Iframe do mapa não encontrado.");
        return null;
    }

    const janelaMapa = iframe.contentWindow;
    const map = janelaMapa.ponteMap || janelaMapa.map;
    const ol = janelaMapa.ponteOl || janelaMapa.ol;

    if (!map || !ol) {
        alert("Mapa ainda não carregou completamente.");
        return null;
    }

    return { map, ol, janelaMapa };
}

function normalizarTextoExport(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

function obterCamadasMarcadas(janelaMapa) {
    const doc = janelaMapa.document;
    const nomes = [];

    doc.querySelectorAll("input[type='checkbox']").forEach(function(checkbox) {
        if (!checkbox.checked) return;

        const item = checkbox.closest("li") || checkbox.parentElement;
        const texto = item ? item.textContent : "";

        if (texto.trim()) {
            nomes.push(texto.replace(/\s+/g, " ").trim());
        }
    });

    console.log("Camadas marcadas na legenda:", nomes);
    return nomes;
}

function percorrerCamadas(layer, callback) {
    if (!layer) return;

    if (layer.getLayers) {
        layer.getLayers().forEach(function(subLayer) {
            percorrerCamadas(subLayer, callback);
        });
        return;
    }

    callback(layer);
}

function obterCamadasDoMapa(map, nomesMarcados) {
    const resultado = [];
    const nomesNormalizados = nomesMarcados.map(normalizarTextoExport);

    map.getLayers().forEach(function(layer) {
        percorrerCamadas(layer, function(subLayer) {
            const source = subLayer.getSource ? subLayer.getSource() : null;
            if (!source || !source.getFeatures) return;

            const nomeCamada = String(
                subLayer.get("title") ||
                subLayer.get("name") ||
                ""
            ).trim();

            const nomeCamadaNorm = normalizarTextoExport(nomeCamada);

            const marcada = nomesNormalizados.some(function(nomeMarcado) {
                return (
                    nomeMarcado === nomeCamadaNorm ||
                    nomeMarcado.includes(nomeCamadaNorm) ||
                    nomeCamadaNorm.includes(nomeMarcado)
                );
            });

            const visivel = subLayer.getVisible ? subLayer.getVisible() : true;
            const temFeatures = source.getFeatures().length > 0;

            if (marcada || (nomesMarcados.length === 0 && visivel && temFeatures)) {
                resultado.push(subLayer);
            }
        });
    });

    console.log("Camadas consideradas para exportação:", resultado.map(layer =>
        layer.get("title") || layer.get("name") || "sem nome"
    ));

}

function obterFeaturesVisiveisNoMapa(map, ol, janelaMapa) {
    const extentAtual = map.getView().calculateExtent(map.getSize());
    const resolution = map.getView().getResolution();

    const nomesMarcados = obterCamadasMarcadas(janelaMapa);
    const camadas = obterCamadasDoMapa(map, nomesMarcados);

    const resultado = [];

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
                if (estilo) copia.setStyle(estilo);
            }

            resultado.push(copia);
        });
    });

    return resultado;
}

function obterNomeFeicao(feature, nomeCamada) {
    const props = feature.getProperties();

    const camposPreferidos = [
        "NOME", "Nome", "nome",
        "EEE",
        "FRENTE", "Frente", "frente",
        "Nome_Lanca",
        "Ficha",
        "NUM_CONTRA", "CONTRATO", "Contrato",
        "STATUS", "STATUS_C", "Status"
    ];

    for (const campo of camposPreferidos) {
        if (props[campo] !== undefined && props[campo] !== null && String(props[campo]).trim() !== "") {
            return nomeCamada + " - " + String(props[campo]).trim();
        }
    }

    return nomeCamada;
}

async function exportarVisualizacaoKMZ() {
    const contexto = obterMapaQgis2web();
    if (!contexto) return;

    const features = obterFeaturesVisiveisNoMapa(
        contexto.map,
        contexto.ol,
        contexto.janelaMapa
    );

    console.log("Feições encontradas para exportar:", features.length);

    if (!features.length) {
        alert("Nenhuma feição visível das camadas marcadas para exportar.");
        return;
    }

    if (typeof JSZip === "undefined") {
        alert("JSZip não foi carregado.");
        return;
    }

    const formatoKML = new contexto.ol.format.KML({
        extractStyles: false,
        writeStyles: true
    });

    const kml = formatoKML.writeFeatures(features, {
        featureProjection: contexto.map.getView().getProjection(),
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

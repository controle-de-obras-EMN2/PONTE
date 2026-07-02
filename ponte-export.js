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
        alert("Iframe do mapa não encontrado. Confira se ele tem id='iframeMapa'.");
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
        alert("Ainda não consegui acessar o objeto do mapa. Aguarde o mapa carregar totalmente e tente novamente.");
        return null;
    }

    if (!ol) {
        alert("A biblioteca OpenLayers não está acessível no mapa.");
        return null;
    }

    return { map, ol, janelaMapa };
}

function obterCamadasMarcadas(janelaMapa) {
    const doc = janelaMapa.document;
    const nomesMarcados = [];

    doc.querySelectorAll("input[type='checkbox']:checked").forEach(function(checkbox) {
        const label = checkbox.closest("label");
        const texto = label ? label.textContent.trim() : "";

        if (texto) {
            nomesMarcados.push(texto);
        }
    });

    console.log("Camadas marcadas na legenda:", nomesMarcados);

    return nomesMarcados;
}

function obterCamadasDoMapa(map, nomesMarcados, resultado = []) {
    map.getLayers().forEach(function(layer) {
        if (layer.getLayers) {
            layer.getLayers().forEach(function(subLayer) {
                obterCamadasDoMapa({ getLayers: () => ({ forEach: cb => cb(subLayer) }) }, nomesMarcados, resultado);
            });
            return;
        }

        const nomeCamada = String(
            layer.get("title") ||
            layer.get("name") ||
            ""
        ).trim();

        const marcada = nomesMarcados.some(function(nomeMarcado) {
            return (
                nomeMarcado === nomeCamada ||
                nomeMarcado.includes(nomeCamada) ||
                nomeCamada.includes(nomeMarcado)
            );
        });

        if (marcada) {
            resultado.push(layer);
        }
    });

    return resultado;
}

function obterFeaturesVisiveisNoMapa(map, ol, janelaMapa) {
    const extentAtual = map.getView().calculateExtent(map.getSize());
    const resolution = map.getView().getResolution();

    const nomesMarcados = obterCamadasMarcadas(janelaMapa);
    const camadas = obterCamadasDoMapa(map, nomesMarcados);

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
        alert("JSZip não foi carregado. Confira o script do JSZip no index.html principal.");
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

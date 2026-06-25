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
   LIMPAR CAMADAS
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

function limparCamadasDoMapa() {
    const contexto = obterMapaQgis2web();

    if (!contexto) {
        alert("Não consegui acessar o mapa para limpar as camadas.");
        return;
    }

    const map = contexto.map;
    const janelaMapa = contexto.janelaMapa;

    let totalDesligadas = 0;

    map.getLayers().forEach(function(layer) {
        totalDesligadas += desligarLayerRecursivo(layer);
    });

    desligarVariaveisLyrDoQgis2web(janelaMapa);
    atualizarCheckboxesDaLegenda(false);

    if (typeof map.render === "function") {
        map.render();
    }

    console.log("Camadas desligadas:", totalDesligadas);

    if (totalDesligadas === 0) {
        console.warn("Nenhuma camada foi desligada pela árvore do mapa.");
        listarCamadasDoMapa(map);
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
    );

    const source = layer.getSource ? layer.getSource() : null;

    if (ehCamadaBase(titulo, source)) {
        return total;
    }

    if (layer.setVisible) {
        layer.setVisible(false);

        if (layer.changed) {
            layer.changed();
        }

        total++;
    }

    return total;
}

function desligarVariaveisLyrDoQgis2web(janelaMapa) {
    if (!janelaMapa) return;

    Object.keys(janelaMapa).forEach(function(nomeVariavel) {
        if (!nomeVariavel.startsWith("lyr_")) return;

        const layer = janelaMapa[nomeVariavel];

        if (!layer || typeof layer.setVisible !== "function") return;

        const titulo = String(
            layer.get("title") ||
            layer.get("name") ||
            nomeVariavel
        );

        const source = layer.getSource ? layer.getSource() : null;

        if (ehCamadaBase(titulo, source)) return;

        layer.setVisible(false);

        if (layer.changed) {
            layer.changed();
        }
    });
}

function ehCamadaBase(titulo, source) {
    const texto = String(titulo || "").toLowerCase();

    if (
        texto.includes("google") ||
        texto.includes("satellite") ||
        texto.includes("hybrid") ||
        texto.includes("osm") ||
        texto.includes("openstreetmap") ||
        texto.includes("bing") ||
        texto.includes("base") ||
        texto.includes("terrain") ||
        texto.includes("terreno")
    ) {
        return true;
    }

    if (source) {
        const nomeSource = source.constructor && source.constructor.name
            ? source.constructor.name.toLowerCase()
            : "";

        if (
            nomeSource.includes("xyz") ||
            nomeSource.includes("osm") ||
            nomeSource.includes("tile")
        ) {
            return true;
        }
    }

    return false;
}

function atualizarCheckboxesDaLegenda(marcado) {
    const iframe = document.getElementById("iframeMapa");

    if (!iframe || !iframe.contentDocument) return;

    const documentoMapa = iframe.contentDocument;

    const checkboxes = documentoMapa.querySelectorAll("input[type='checkbox']");

    checkboxes.forEach(function(checkbox) {
        checkbox.checked = marcado;
    });
}

function listarCamadasDoMapa(map) {
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

    const source = layer.getSource ? layer.getSource() : null;

    console.log({
        indice: index,
        titulo: layer.get("title"),
        nome: layer.get("name"),
        visivel: layer.getVisible ? layer.getVisible() : null,
        source: source && source.constructor ? source.constructor.name : null
    });
}

/* =========================================================
   PONTE EXPORT / KMZ
   Exporta somente camadas marcadas + feições dentro da tela
   ========================================================= */

console.log("ponte-export.js carregado");

document.addEventListener("click", function(event) {
    const botao = event.target.closest("#btnExportarKMZ");

    if (!botao) return;

    event.preventDefault();

    console.log("Clique recebido no botão Exportar KMZ");
    exportarVisualizacaoKMZ();
});


/* =========================================================
   ACESSO AO MAPA
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

    const map = janelaMapa.ponteMap || janelaMapa.map;
    const ol = janelaMapa.ponteOl || janelaMapa.ol;

    if (!map || !ol) {
        alert("Mapa ainda não carregou completamente. Aguarde alguns segundos e tente novamente.");
        return null;
    }

    return {
        map,
        ol,
        janelaMapa
    };
}


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

function normalizarExport(valor) {
    return String(valor || "")
        .replace(/<[^>]*>/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

function textoLimpo(valor) {
    return String(valor || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function ehCamadaBase(layer) {
    const titulo = normalizarExport(layer.get("title") || layer.get("name") || "");
    const source = layer.getSource ? layer.getSource() : null;

    const sourceNome = source && source.constructor
        ? normalizarExport(source.constructor.name)
        : "";

    return (
        titulo.includes("GOOGLE") ||
        titulo.includes("SATELLITE") ||
        titulo.includes("HYBRID") ||
        titulo.includes("OSM") ||
        titulo.includes("OPENSTREETMAP") ||
        titulo.includes("BING") ||
        titulo.includes("BASE") ||
        sourceNome.includes("XYZ") ||
        sourceNome.includes("OSM") ||
        sourceNome.includes("TILE")
    );
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

function obterCamadasVetoriais(map) {
    const camadas = [];

    map.getLayers().forEach(function(layer) {
        percorrerCamadas(layer, function(subLayer) {
            if (ehCamadaBase(subLayer)) return;

            const source = subLayer.getSource ? subLayer.getSource() : null;

            if (!source || typeof source.getFeatures !== "function") return;

            camadas.push(subLayer);
        });
    });

    return camadas;
}


/* =========================================================
   LER CAMADAS MARCADAS NA LEGENDA
   ========================================================= */

function obterCheckboxesCamadas(janelaMapa) {
    const doc = janelaMapa.document;

    const checkboxes = Array.from(
        doc.querySelectorAll("input[type='checkbox']")
    );

    const itens = checkboxes.map(function(checkbox, index) {
        const li = checkbox.closest("li");
        const label = checkbox.closest("label");

        let texto = "";

        if (li) {
            const clone = li.cloneNode(true);

            clone.querySelectorAll("ul, img, input").forEach(function(el) {
                el.remove();
            });

            texto = clone.textContent || "";
        }

        if (!texto && label) {
            texto = label.textContent || "";
        }

        if (!texto && checkbox.parentElement) {
            texto = checkbox.parentElement.textContent || "";
        }

        return {
            index,
            checkbox,
            checked: checkbox.checked,
            texto: textoLimpo(texto),
            textoNorm: normalizarExport(texto)
        };
    });

    console.log("Checkboxes de camadas encontrados:", itens);

    return itens;
}

function obterCamadasSelecionadasParaExportar(map, janelaMapa) {
    const camadasVetoriais = obterCamadasVetoriais(map);

    /*
       No qgis2web, a legenda normalmente aparece na ordem inversa
       da pilha de camadas do mapa.
    */
    const camadasNaOrdemDaLegenda = camadasVetoriais.slice().reverse();

    const checkboxes = obterCheckboxesCamadas(janelaMapa);
    const marcados = checkboxes.filter(item => item.checked);

    console.log("Camadas vetoriais do mapa:", camadasVetoriais.map(layer =>
        textoLimpo(layer.get("title") || layer.get("name") || "sem nome")
    ));

    console.log("Itens marcados na legenda:", marcados.map(item => item.texto));

    if (!marcados.length) {
        alert("Nenhuma camada está marcada na legenda para exportar.");
        return [];
    }

    const selecionadas = [];

    /*
       1ª tentativa: associar pelo nome da camada.
    */
    marcados.forEach(function(itemMarcado) {
        const camadaEncontrada = camadasVetoriais.find(function(layer) {
            const nomeLayer = normalizarExport(layer.get("title") || layer.get("name") || "");

            return (
                itemMarcado.textoNorm.includes(nomeLayer) ||
                nomeLayer.includes(itemMarcado.textoNorm)
            );
        });

        if (camadaEncontrada && !selecionadas.includes(camadaEncontrada)) {
            selecionadas.push(camadaEncontrada);
        }
    });

    /*
       2ª tentativa: associar pela ordem da legenda.
       Isso resolve quando o qgis2web coloca título com HTML/imagem.
    */
    if (!selecionadas.length) {
        marcados.forEach(function(itemMarcado) {
            const camada = camadasNaOrdemDaLegenda[itemMarcado.index];

            if (camada && !selecionadas.includes(camada)) {
                selecionadas.push(camada);
            }
        });
    }

    console.log("Camadas selecionadas para exportar:", selecionadas.map(layer =>
        textoLimpo(layer.get("title") || layer.get("name") || "sem nome")
    ));

    return selecionadas;
}


/* =========================================================
   FILTRAR FEIÇÕES NA TELA
   ========================================================= */

function obterFeaturesVisiveisNoMapa(map, ol, janelaMapa) {
    const extentAtual = map.getView().calculateExtent(map.getSize());
    const resolution = map.getView().getResolution();

    const camadas = obterCamadasSelecionadasParaExportar(map, janelaMapa);

    const resultado = [];

    camadas.forEach(function(layer) {
        const source = layer.getSource ? layer.getSource() : null;

        if (!source || typeof source.getFeatures !== "function") return;

        const nomeCamada =
            textoLimpo(layer.get("title")) ||
            textoLimpo(layer.get("name")) ||
            "Camada sem nome";

        const styleFunction = layer.getStyleFunction
            ? layer.getStyleFunction()
            : null;

        source.getFeatures().forEach(function(feature) {
            const geometria = feature.getGeometry();

            if (!geometria) return;

            if (!ol.extent.intersects(extentAtual, geometria.getExtent())) {
                return;
            }

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
        "Ficha",
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


/* =========================================================
   EXPORTAR KMZ
   ========================================================= */

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

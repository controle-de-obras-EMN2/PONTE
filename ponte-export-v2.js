/* =========================================================
   PONTE EXPORT / KMZ
   Exportação com seleção própria de camadas
   ========================================================= */

console.log("ponte-export-v2.js carregado");

let ponteCamadasParaExportar = [];

/* =========================================================
   CLIQUE NO BOTÃO EXPORTAR
   ========================================================= */

document.addEventListener("click", function(event) {
    const botao = event.target.closest("#btnExportarKMZ");

    if (!botao) return;

    event.preventDefault();

    console.log("Clique recebido no botão Exportar KMZ");
    abrirJanelaExportacaoKMZ();
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
   AUXILIARES
   ========================================================= */

function textoLimpo(valor) {
    return String(valor || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarExport(valor) {
    return textoLimpo(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
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

            const nome = textoLimpo(
                subLayer.get("title") ||
                subLayer.get("name") ||
                "Camada sem nome"
            );

            camadas.push({
                nome: nome,
                layer: subLayer,
                quantidade: source.getFeatures().length
            });
        });
    });

    return camadas;
}


/* =========================================================
   JANELA PRÓPRIA DE EXPORTAÇÃO
   ========================================================= */

function criarModalExportacaoSeNaoExistir() {
    if (document.getElementById("ponteModalExportKMZ")) return;

    const modal = document.createElement("div");

    modal.id = "ponteModalExportKMZ";

    modal.innerHTML = `
        <div class="ponte-export-overlay"></div>

        <div class="ponte-export-box">
            <div class="ponte-export-header">
                <h2>Exportar KMZ</h2>
                <button type="button" id="ponteFecharExportKMZ">×</button>
            </div>

           <p class="ponte-export-info">
    Selecione as camadas que deseja exportar.
</p>

<label class="ponte-export-opcao-tela">
    <input type="checkbox" id="ponteExportarSomenteTela" checked>
    Exportar somente as feições visíveis na tela atual
</label>

            <div class="ponte-export-actions">
                <button type="button" id="ponteSelecionarTodasCamadas">Selecionar todas</button>
                <button type="button" id="ponteLimparSelecaoCamadas">Limpar seleção</button>
            </div>

            <div id="ponteListaCamadasExportKMZ" class="ponte-export-lista"></div>

            <div class="ponte-export-footer">
                <button type="button" id="ponteCancelarExportKMZ">Cancelar</button>
                <button type="button" id="ponteConfirmarExportKMZ">Exportar KMZ</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const estilo = document.createElement("style");

    estilo.innerHTML = `
        #ponteModalExportKMZ {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999999;
            font-family: Segoe UI, Arial, sans-serif;
        }

        #ponteModalExportKMZ.ativo {
            display: block;
        }

        .ponte-export-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.45);
        }

        .ponte-export-box {
            position: relative;
            background: #fff;
            width: min(720px, calc(100vw - 32px));
            max-height: 82vh;
            overflow: auto;
            margin: 70px auto;
            border-radius: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,.3);
        }

        .ponte-export-header {
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 22px;
            border-bottom: 1px solid #ddd;
        }

        .ponte-export-header h2 {
            margin: 0;
            color: #0b2f5b;
            font-size: 22px;
        }

        #ponteFecharExportKMZ {
            width: 34px;
            height: 34px;
            border: none;
            border-radius: 50%;
            background: #0b2f5b;
            color: #fff;
            font-size: 22px;
            cursor: pointer;
        }

        .ponte-export-info {
            margin: 18px 22px 10px;
            color: #333;
        }

        .ponte-export-actions {
            display: flex;
            gap: 10px;
            margin: 0 22px 14px;
        }

        .ponte-export-actions button,
        .ponte-export-footer button {
            border: none;
            border-radius: 8px;
            padding: 9px 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .ponte-export-actions button {
            background: #eef2f7;
            color: #0b2f5b;
        }

        .ponte-export-lista {
            margin: 0 22px 18px;
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
        }

        .ponte-export-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 11px 13px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }

        .ponte-export-item:last-child {
            border-bottom: none;
        }

        .ponte-export-item:hover {
            background: #f4f6f8;
        }

        .ponte-export-item input {
            width: 18px;
            height: 18px;
        }

        .ponte-export-nome {
            flex: 1;
            color: #0b2f5b;
            font-weight: 700;
        }

        .ponte-export-qtd {
            color: #666;
            font-size: 12px;
        }

        .ponte-export-footer {
            position: sticky;
            bottom: 0;
            background: #fff;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 22px;
            border-top: 1px solid #ddd;
        }

        #ponteCancelarExportKMZ {
            background: #e5e7eb;
            color: #111;
        }

        #ponteConfirmarExportKMZ {
            background: #0b2f5b;
            color: #fff;
        }

        .ponte-export-opcao-tela {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 22px 16px;
    color: #0b2f5b;
    font-weight: 700;
    cursor: pointer;
}

.ponte-export-opcao-tela input {
    width: 18px;
    height: 18px;
}
    `;

    document.head.appendChild(estilo);

    document.getElementById("ponteFecharExportKMZ").addEventListener("click", fecharJanelaExportacaoKMZ);
    document.getElementById("ponteCancelarExportKMZ").addEventListener("click", fecharJanelaExportacaoKMZ);

    document.querySelector("#ponteModalExportKMZ .ponte-export-overlay")
        .addEventListener("click", fecharJanelaExportacaoKMZ);

    document.getElementById("ponteSelecionarTodasCamadas").addEventListener("click", function() {
        document.querySelectorAll(".ponte-export-check").forEach(check => {
            check.checked = true;
        });
    });

    document.getElementById("ponteLimparSelecaoCamadas").addEventListener("click", function() {
        document.querySelectorAll(".ponte-export-check").forEach(check => {
            check.checked = false;
        });
    });

    document.getElementById("ponteConfirmarExportKMZ").addEventListener("click", function() {
        confirmarExportacaoKMZSelecionada();
    });
}

function abrirJanelaExportacaoKMZ() {
    const contexto = obterMapaQgis2web();

    if (!contexto) return;

    criarModalExportacaoSeNaoExistir();

    ponteCamadasParaExportar = obterCamadasVetoriais(contexto.map);

    const lista = document.getElementById("ponteListaCamadasExportKMZ");

    lista.innerHTML = "";

    ponteCamadasParaExportar.forEach(function(item, index) {
        const linha = document.createElement("label");

        linha.className = "ponte-export-item";

        linha.innerHTML = `
            <input class="ponte-export-check" type="checkbox" value="${index}">
            <span class="ponte-export-nome">${item.nome}</span>
            <span class="ponte-export-qtd">${item.quantidade.toLocaleString("pt-BR")} feições</span>
        `;

        lista.appendChild(linha);
    });

    document.getElementById("ponteModalExportKMZ").classList.add("ativo");
}

function fecharJanelaExportacaoKMZ() {
    const modal = document.getElementById("ponteModalExportKMZ");

    if (modal) {
        modal.classList.remove("ativo");
    }
}

function confirmarExportacaoKMZSelecionada() {
    const checks = Array.from(document.querySelectorAll(".ponte-export-check:checked"));

    const camadasSelecionadas = checks
        .map(check => ponteCamadasParaExportar[Number(check.value)])
        .filter(Boolean)
        .map(item => item.layer);

    if (!camadasSelecionadas.length) {
        alert("Selecione pelo menos uma camada para exportar.");
        return;
    }

    const somenteTela = document.getElementById("ponteExportarSomenteTela")?.checked ?? true;

    fecharJanelaExportacaoKMZ();

    exportarVisualizacaoKMZ(camadasSelecionadas, somenteTela);
}


/* =========================================================
   FEIÇÕES DENTRO DA TELA
   ========================================================= */

function obterFeaturesVisiveisNoMapa(map, ol, camadasSelecionadas, somenteTela) {
    const extentAtual = map.getView().calculateExtent(map.getSize());
    const resolution = map.getView().getResolution();

    const resultado = [];

    camadasSelecionadas.forEach(function(layer) {
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

            if (somenteTela && !ol.extent.intersects(extentAtual, geometria.getExtent())) {
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

async function exportarVisualizacaoKMZ(camadasSelecionadas, somenteTela = true) {
    const contexto = obterMapaQgis2web();

    if (!contexto) return;

    const features = obterFeaturesVisiveisNoMapa(
        contexto.map,
        contexto.ol,
        camadasSelecionadas,
        somenteTela
    );

    console.log("Camadas escolhidas para exportar:", camadasSelecionadas.map(layer =>
        textoLimpo(layer.get("title") || layer.get("name") || "sem nome")
    ));

    console.log("Exportar somente tela atual:", somenteTela);
    console.log("Feições encontradas para exportar:", features.length);

    if (!features.length) {
        alert("Nenhuma feição das camadas escolhidas foi encontrada para exportar.");
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
    link.download = somenteTela
        ? "visualizacao_ponte_tela_atual.kmz"
        : "visualizacao_ponte_camadas_completas.kmz";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

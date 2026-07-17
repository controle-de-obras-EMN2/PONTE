/* =========================================================
   PONTE MAP TOOLS
   Filtros do mapa, Street View e exportação PDF do mapa
   Arquivo externo ao qgis2web para preservar melhorias do PONTE
   ========================================================= */

console.log("ponte-map-tools.js carregado");

(function () {
    const CAMPOS = {
        contrato: ["NUM_CONTRA", "Contrato_N", "CONTRATO", "Contrato", "contrato"],
        frente: ["FRENTE", "Frente", "frente", "OBRA", "layer"],
        material: ["MATERIAL", "Material", "material"],
        diametro: ["DIAMETR_MM", "Diametro", "DIAMETRO", "diametro"]
    };

    let mapReadyTentativas = 0;
    let streetViewAtivo = false;

    document.addEventListener("DOMContentLoaded", function () {
        aguardarMapaPonte();
        ativarBotoesDoMapa();
    });

    function obterIframeMapa() {
        return document.getElementById("iframeMapa") || document.getElementById("mapa-frame");
    }

    function obterContextoMapa() {
        const iframe = obterIframeMapa();
        if (!iframe || !iframe.contentWindow) return null;

        const janelaMapa = iframe.contentWindow;
        const map = janelaMapa.ponteMap || janelaMapa.map;
        const ol = janelaMapa.ponteOl || janelaMapa.ol;

        if (!map || !ol) return null;

        return { iframe, janelaMapa, map, ol };
    }

    function aguardarMapaPonte() {
        const contexto = obterContextoMapa();

        if (!contexto) {
            mapReadyTentativas++;
            if (mapReadyTentativas < 80) {
                setTimeout(aguardarMapaPonte, 250);
            } else {
                console.warn("PONTE: mapa não ficou disponível para os filtros.");
            }
            return;
        }

        prepararBackupsDeFeicoes(contexto.map);
        preencherFiltrosDoMapa(contexto.map);
        instalarCliqueStreetView(contexto);
        console.log("PONTE: filtros do mapa prontos.");
    }

    function ehCamadaBase(layer) {
        const titulo = normalizar(
            layer.get("title") ||
            layer.get("name") ||
            ""
        );

        const source = layer.getSource ? layer.getSource() : null;
        const sourceNome = source && source.constructor ? normalizar(source.constructor.name) : "";

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
            layer.getLayers().forEach(function (subLayer) {
                percorrerCamadas(subLayer, callback);
            });
            return;
        }

        callback(layer);
    }

    function obterCamadasVetoriais(map) {
        const camadas = [];

        map.getLayers().forEach(function (layer) {
            percorrerCamadas(layer, function (subLayer) {
                if (ehCamadaBase(subLayer)) return;

                const source = subLayer.getSource ? subLayer.getSource() : null;
                if (!source || typeof source.getFeatures !== "function") return;

                camadas.push(subLayer);
            });
        });

        return camadas;
    }

    function prepararBackupsDeFeicoes(map) {
        obterCamadasVetoriais(map).forEach(function (layer) {
            const source = layer.getSource();
            if (!layer.get("ponte_features_original")) {
                layer.set("ponte_features_original", source.getFeatures().slice());
            }
        });
    }

    function normalizar(valor) {
        return String(valor || "")
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

    function valorCampo(properties, campos) {
        for (const campo of campos) {
            if (properties[campo] !== undefined && properties[campo] !== null && String(properties[campo]).trim() !== "") {
                return String(properties[campo]).trim();
            }
        }
        return "";
    }

    function coletarValores(map, tipo) {
        const valores = new Set();
        const campos = CAMPOS[tipo];

        obterCamadasVetoriais(map).forEach(function (layer) {
            const features = layer.get("ponte_features_original") || layer.getSource().getFeatures();

            features.forEach(function (feature) {
                const props = feature.getProperties ? feature.getProperties() : {};
                const valor = valorCampo(props, campos);
                if (valor) valores.add(valor);
            });
        });

        return Array.from(valores).sort(function (a, b) {
            return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
        });
    }

    function preencherSelect(id, valores, labelTodos) {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = `<option value="">${labelTodos}</option>`;

        valores.forEach(function (valor) {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });

        if (valorAtual && valores.includes(valorAtual)) {
            select.value = valorAtual;
        }
    }

    function preencherFiltrosDoMapa(map) {
        preencherSelect("filtroMapaContrato", coletarValores(map, "contrato"), "Todos os contratos");
        preencherSelect("filtroMapaFrente", coletarValores(map, "frente"), "Todas as frentes");
        preencherSelect("filtroMapaMaterial", coletarValores(map, "material"), "Todos os materiais");
        preencherSelect("filtroMapaDiametro", coletarValores(map, "diametro"), "Todos os diâmetros");
    }

    function obterFiltrosAtuais() {
        return {
            contrato: document.getElementById("filtroMapaContrato")?.value || "",
            frente: document.getElementById("filtroMapaFrente")?.value || "",
            material: document.getElementById("filtroMapaMaterial")?.value || "",
            diametro: document.getElementById("filtroMapaDiametro")?.value || ""
        };
    }

    function featureAtendeFiltros(feature, filtros) {
        const props = feature.getProperties ? feature.getProperties() : {};

        const testes = [
            [filtros.contrato, CAMPOS.contrato],
            [filtros.frente, CAMPOS.frente],
            [filtros.material, CAMPOS.material],
            [filtros.diametro, CAMPOS.diametro]
        ];

        return testes.every(function ([valorFiltro, campos]) {
            if (!valorFiltro) return true;

            const valorFeature = valorCampo(props, campos);
            return normalizar(valorFeature) === normalizar(valorFiltro);
        });
    }

    function aplicarFiltrosMapa() {
        const contexto = obterContextoMapa();
        if (!contexto) {
            alert("O mapa ainda não carregou. Tente novamente em alguns segundos.");
            return;
        }

        prepararBackupsDeFeicoes(contexto.map);

        const filtros = obterFiltrosAtuais();
        let total = 0;
        let extent = contexto.ol.extent.createEmpty();

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original") || source.getFeatures().slice();
            const filtradas = todas.filter(function (feature) {
                return featureAtendeFiltros(feature, filtros);
            });

            source.clear(true);
            if (filtradas.length) {
                source.addFeatures(filtradas);
                layer.setVisible(true);
            }

            filtradas.forEach(function (feature) {
                const geom = feature.getGeometry && feature.getGeometry();
                if (geom) contexto.ol.extent.extend(extent, geom.getExtent());
            });

            total += filtradas.length;
            if (layer.changed) layer.changed();
        });

        if (total && !contexto.ol.extent.isEmpty(extent)) {
            contexto.map.getView().fit(extent, {
                padding: [80, 80, 80, 80],
                maxZoom: 18,
                duration: 700
            });
        }

        if (contexto.map.render) contexto.map.render();

        const resumo = document.getElementById("resumoFiltrosMapa");
        if (resumo) resumo.textContent = total ? `${total.toLocaleString("pt-BR")} feição(ões) filtrada(s)` : "Nenhum item encontrado";

        console.log("PONTE: filtros aplicados no mapa", filtros, total);
    }

    function limparFiltrosMapa() {
        const contexto = obterContextoMapa();
        if (!contexto) return;

        ["filtroMapaContrato", "filtroMapaFrente", "filtroMapaMaterial", "filtroMapaDiametro"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original");

            if (todas) {
                source.clear(true);
                source.addFeatures(todas);
            }

            layer.setVisible(true);
            if (layer.changed) layer.changed();
        });

        const resumo = document.getElementById("resumoFiltrosMapa");
        if (resumo) resumo.textContent = "Filtros limpos";

        if (contexto.map.render) contexto.map.render();
    }

    function limparCamadasMapa() {
        const contexto = obterContextoMapa();
        if (!contexto) return;

        if (contexto.janelaMapa.PONTE_MAP_BRIDGE && contexto.janelaMapa.PONTE_MAP_BRIDGE.limparCamadas) {
            contexto.janelaMapa.PONTE_MAP_BRIDGE.limparCamadas();
            return;
        }

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            if (!layer.get("ponte_features_original")) {
                layer.set("ponte_features_original", source.getFeatures().slice());
            }
            source.clear(true);
            layer.setVisible(false);
        });
    }

    function ativarBotoesDoMapa() {
        document.addEventListener("click", function (event) {
            const id = event.target && event.target.id;

            if (id === "btnAplicarFiltrosMapa") aplicarFiltrosMapa();
            if (id === "btnLimparFiltrosMapa") limparFiltrosMapa();
            if (id === "btnLimparCamadas") limparCamadasMapa();
            if (id === "btnStreetView") alternarStreetView();
            if (id === "btnExportarMapaPDF") exportarMapaPDF();
        });

        ["filtroMapaContrato", "filtroMapaFrente", "filtroMapaMaterial", "filtroMapaDiametro"].forEach(function (id) {
            document.addEventListener("change", function (event) {
                if (event.target && event.target.id === id) aplicarFiltrosMapa();
            });
        });
    }

    function instalarCliqueStreetView(contexto) {
        if (!contexto.map || contexto.map.get("ponte_streetview_listener")) return;

        contexto.map.set("ponte_streetview_listener", true);

        contexto.map.on("singleclick", function (evt) {
            if (!streetViewAtivo) return;

            const coord4326 = contexto.ol.proj.toLonLat(evt.coordinate);
            const lon = coord4326[0];
            const lat = coord4326[1];

            const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
            window.open(url, "_blank", "noopener,noreferrer");

            alternarStreetView(false);
        });
    }

    function alternarStreetView(forcarEstado) {
        const contexto = obterContextoMapa();
        if (!contexto) return;

        streetViewAtivo = typeof forcarEstado === "boolean" ? forcarEstado : !streetViewAtivo;

        const btn = document.getElementById("btnStreetView");
        if (btn) {
            btn.classList.toggle("ativo", streetViewAtivo);
            btn.textContent = streetViewAtivo ? "📍 Clique no mapa" : "🟠 Street View";
        }

        const iframe = obterIframeMapa();
        if (iframe) iframe.classList.toggle("streetview-ativo", streetViewAtivo);

        instalarCliqueStreetView(contexto);
    }

    function obterLegendasVisiveis() {
        const contexto = obterContextoMapa();
        if (!contexto) return [];

        return obterCamadasVetoriais(contexto.map)
            .filter(function (layer) {
                const source = layer.getSource && layer.getSource();
                return source && source.getFeatures && source.getFeatures().length > 0;
            })
            .map(function (layer) {
                return textoLimpo(layer.get("title") || layer.get("name") || "Camada sem nome");
            })
            .filter(Boolean)
            .slice(0, 14);
    }

    async function exportarMapaPDF() {
        const contexto = obterContextoMapa();
        if (!contexto) {
            alert("Mapa ainda não carregou.");
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("A biblioteca jsPDF não foi carregada.");
            return;
        }

        const canvasMapa = capturarCanvasOpenLayers(contexto.janelaMapa.document);

        if (!canvasMapa) {
            alert("Não consegui capturar o canvas do mapa.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("landscape", "mm", "a4");

        const larguraPagina = 297;
        const alturaPagina = 210;
        const margem = 10;
        const tituloAltura = 14;
        const legendaLargura = 62;
        const mapaLargura = larguraPagina - (margem * 2) - legendaLargura - 6;
        const mapaAltura = alturaPagina - (margem * 2) - tituloAltura;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.text("PONTE - Mapa Operacional EMN2", margem, 13);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(`Exportado em ${new Date().toLocaleString("pt-BR")}`, margem, 18);

        const imagem = canvasMapa.toDataURL("image/png");
        pdf.addImage(imagem, "PNG", margem, margem + tituloAltura, mapaLargura, mapaAltura);

        const xLeg = margem + mapaLargura + 6;
        let y = margem + tituloAltura;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("Legenda", xLeg, y);
        y += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);

        const legendas = obterLegendasVisiveis();
        if (!legendas.length) {
            pdf.text("Nenhuma camada vetorial visível.", xLeg, y);
        } else {
            legendas.forEach(function (texto) {
                const linhas = pdf.splitTextToSize(texto, legendaLargura - 3);
                if (y + linhas.length * 4 > alturaPagina - margem) return;
                pdf.text(linhas, xLeg, y);
                y += linhas.length * 4 + 2;
            });
        }

        pdf.save("ponte_mapa.pdf");
    }

    function capturarCanvasOpenLayers(docMapa) {
        const canvases = Array.from(docMapa.querySelectorAll(".ol-layer canvas, canvas.ol-unselectable, canvas"))
            .filter(function (canvas) {
                return canvas.width > 0 && canvas.height > 0 && canvas.offsetParent !== null;
            });

        if (!canvases.length) return null;

        const primeiro = canvases[0];
        const saida = document.createElement("canvas");
        saida.width = primeiro.width;
        saida.height = primeiro.height;
        const ctx = saida.getContext("2d");

        canvases.forEach(function (canvas) {
            let opacity = 1;
            const parent = canvas.parentElement;
            if (parent && parent.style.opacity) opacity = Number(parent.style.opacity) || 1;

            ctx.globalAlpha = opacity;

            try {
                const transform = canvas.style.transform;
                if (transform && transform.startsWith("matrix")) {
                    const matrix = transform.match(/^matrix\(([^\)]*)\)$/);
                    if (matrix) {
                        const values = matrix[1].split(",").map(Number);
                        ctx.setTransform(values[0], values[1], values[2], values[3], values[4], values[5]);
                    }
                } else {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }
                ctx.drawImage(canvas, 0, 0);
            } catch (erro) {
                console.warn("Falha ao capturar camada do mapa no PDF:", erro);
            }
        });

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        return saida;
    }

    window.PONTE_MAP_TOOLS = {
        aplicarFiltrosMapa,
        limparFiltrosMapa,
        limparCamadasMapa,
        alternarStreetView,
        exportarMapaPDF,
        preencherFiltros: function () {
            const contexto = obterContextoMapa();
            if (contexto) preencherFiltrosDoMapa(contexto.map);
        }
    };
})();

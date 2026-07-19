/* =========================================================
   PONTE MAP TOOLS
   Filtros em funil, Street View, exportação PDF e limpar camadas
   Arquivo externo ao qgis2web para preservar melhorias do PONTE
   ========================================================= */

console.log("ponte-map-tools.js carregado - versão funil robusta 2026-07-17");

(function () {
    const CAMPOS = {
        contrato: ["NUM_CONTRA", "Contrato_N", "CONTRATO", "Contrato", "contrato"],
        frente: ["FRENTE", "Frente", "frente", "OBRA", "Nome_Lanca", "EEE"],
        material: ["MATERIAL", "Material", "material", "TIPO", "Tipo", "tipo"],
        diametro: ["DIAMETR_MM", "Diametro", "DIAMETRO", "diametro"]
    };

    const SELECTS = {
        contrato: "filtroMapaContrato",
        frente: "filtroMapaFrente",
        material: "filtroMapaMaterial",
        diametro: "filtroMapaDiametro"
    };

    const LABELS = {
        contrato: "Todos os contratos",
        frente: "Todas as frentes",
        material: "Todos os materiais",
        diametro: "Todos os diâmetros"
    };

    let mapReadyTentativas = 0;
    let streetViewAtivo = false;
    let atualizandoSelects = false;

    document.addEventListener("DOMContentLoaded", function () {
        const iframe = obterIframeMapa();
        if (iframe) {
            iframe.addEventListener("load", function () {
                mapReadyTentativas = 0;
                setTimeout(aguardarMapaPonte, 350);
            });
        }

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
            repetirAguardando("PONTE: aguardando mapa para filtros.");
            return;
        }

        prepararBackupsDeFeicoes(contexto.map);
        removerFrentesConcluidasDoMapa(contexto.map);

        const totalFeatures = obterRegistrosFiltravel(contexto.map).length;
        if (!totalFeatures) {
            repetirAguardando("PONTE: aguardando feições do mapa para montar filtros.");
            return;
        }

        atualizarOpcoesFunil(contexto.map);
        instalarCliqueStreetView(contexto);
        console.log("PONTE: filtros do mapa prontos.", totalFeatures, "feições lidas.");
    }

    function repetirAguardando(mensagem) {
        mapReadyTentativas++;
        if (mapReadyTentativas < 100) {
            setTimeout(aguardarMapaPonte, 250);
        } else {
            console.warn(mensagem);
        }
    }

    function normalizar(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function textoLimpo(valor) {
        return String(valor ?? "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function valorStatusFrente(props) {
        if (!props) return "";
        return props["AJUSTE STA"] ?? props.STATUS ?? props.Status ?? props.status ?? "";
    }

    function ehFrenteMatriz(props) {
        if (!props) return false;
        return (
            props["AJUSTE STA"] !== undefined ||
            props.RISCO !== undefined ||
            props.Risco !== undefined ||
            props.GAS !== undefined ||
            props.SOMA !== undefined
        );
    }

    function ehFrenteConcluida(featureOuProps) {
        const props = featureOuProps && featureOuProps.getProperties ? featureOuProps.getProperties() : featureOuProps;
        if (!ehFrenteMatriz(props)) return false;
        return normalizar(valorStatusFrente(props)).includes("CONCLUID");
    }

    function removerFrentesConcluidasDoMapa(map) {
        obterCamadasVetoriais(map).forEach(function(layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original") || source.getFeatures() || [];
            const visiveis = todas.filter(feature => !ehFrenteConcluida(feature));
            if (visiveis.length !== todas.length) {
                source.clear(true);
                if (visiveis.length) source.addFeatures(visiveis);
                if (layer.changed) layer.changed();
            }
        });
    }

    function ehCamadaBase(layer) {
        const titulo = normalizar(layer.get("title") || layer.get("name") || "");
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
        if (!map || !map.getLayers) return camadas;

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
            const featuresAtuais = source.getFeatures ? source.getFeatures().slice() : [];

            if (!layer.get("ponte_features_original") && featuresAtuais.length) {
                layer.set("ponte_features_original", featuresAtuais);
            }
        });
    }

    function obterValorCampo(properties, campos) {
        if (!properties) return "";

        for (const campo of campos) {
            const valor = properties[campo];
            if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
                return String(valor).trim();
            }
        }

        const mapaChaves = {};
        Object.keys(properties).forEach(function (chave) {
            mapaChaves[normalizar(chave)] = chave;
        });

        for (const campo of campos) {
            const chaveReal = mapaChaves[normalizar(campo)];
            if (!chaveReal) continue;
            const valor = properties[chaveReal];
            if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
                return String(valor).trim();
            }
        }

        return "";
    }

    function valorTipo(properties, tipo) {
        return obterValorCampo(properties, CAMPOS[tipo] || []);
    }

    function obterRegistrosFiltravel(map) {
        const registros = [];

        obterCamadasVetoriais(map).forEach(function (layer) {
            const source = layer.getSource();
            const features = layer.get("ponte_features_original") || source.getFeatures() || [];
            const titulo = textoLimpo(layer.get("popuplayertitle") || layer.get("title") || layer.get("name") || "");

            features.forEach(function (feature) {
                const props = feature.getProperties ? feature.getProperties() : {};
                if (ehFrenteConcluida(props)) return;
                registros.push({ layer, feature, props, titulo });
            });
        });

        return registros;
    }

    function obterFiltrosAtuais() {
        return {
            contrato: document.getElementById(SELECTS.contrato)?.value || "",
            frente: document.getElementById(SELECTS.frente)?.value || "",
            material: document.getElementById(SELECTS.material)?.value || "",
            diametro: document.getElementById(SELECTS.diametro)?.value || ""
        };
    }

    function registroAtendeFiltros(registro, filtros, ignorarTipo) {
        return ["contrato", "frente", "material", "diametro"].every(function (tipo) {
            if (tipo === ignorarTipo) return true;

            const valorFiltro = filtros[tipo];
            if (!valorFiltro) return true;

            const valorRegistro = valorTipo(registro.props, tipo);
            return normalizar(valorRegistro) === normalizar(valorFiltro);
        });
    }

    function coletarValoresFiltrados(map, tipo, filtros) {
        const valores = new Set();

        obterRegistrosFiltravel(map).forEach(function (registro) {
            if (!registroAtendeFiltros(registro, filtros, tipo)) return;
            const valor = valorTipo(registro.props, tipo);
            if (valor) valores.add(valor);
        });

        return Array.from(valores).sort(function (a, b) {
            return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
        });
    }

    function preencherSelect(id, valores, labelTodos, valorAtual) {
        const select = document.getElementById(id);
        if (!select) return "";

        select.innerHTML = `<option value="">${labelTodos}</option>`;

        valores.forEach(function (valor) {
            const option = document.createElement("option");
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });

        if (valorAtual && valores.some(v => normalizar(v) === normalizar(valorAtual))) {
            const equivalente = valores.find(v => normalizar(v) === normalizar(valorAtual));
            select.value = equivalente;
            return equivalente;
        }

        return "";
    }

    function atualizarOpcoesFunil(map) {
        if (!map) {
            const contexto = obterContextoMapa();
            if (!contexto) return;
            map = contexto.map;
        }

        prepararBackupsDeFeicoes(map);

        atualizandoSelects = true;
        const filtros = obterFiltrosAtuais();

        ["contrato", "frente", "material", "diametro"].forEach(function (tipo) {
            const valores = coletarValoresFiltrados(map, tipo, filtros);
            filtros[tipo] = preencherSelect(SELECTS[tipo], valores, LABELS[tipo], filtros[tipo]);
        });

        atualizandoSelects = false;
    }

    function featureAtendeFiltros(feature, filtros) {
        const props = feature.getProperties ? feature.getProperties() : {};

        return ["contrato", "frente", "material", "diametro"].every(function (tipo) {
            const valorFiltro = filtros[tipo];
            if (!valorFiltro) return true;

            const valorFeature = valorTipo(props, tipo);
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
        if (!atualizandoSelects) atualizarOpcoesFunil(contexto.map);

        const filtros = obterFiltrosAtuais();
        let total = 0;
        let extent = contexto.ol.extent.createEmpty();

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original") || source.getFeatures().slice();
            const filtradas = todas.filter(function (feature) {
                return !ehFrenteConcluida(feature) && featureAtendeFiltros(feature, filtros);
            });

            source.clear(true);
            if (filtradas.length) {
                source.addFeatures(filtradas);
                if (typeof layer.setVisible === "function") layer.setVisible(true);
            } else {
                if (Object.values(filtros).some(Boolean) && typeof layer.setVisible === "function") {
                    layer.setVisible(false);
                }
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

        ["contrato", "frente", "material", "diametro"].forEach(function (tipo) {
            const el = document.getElementById(SELECTS[tipo]);
            if (el) el.value = "";
        });

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original");

            if (todas) {
                const visiveis = todas.filter(feature => !ehFrenteConcluida(feature));
                source.clear(true);
                source.addFeatures(visiveis);
            }

            if (typeof layer.setVisible === "function") layer.setVisible(true);
            if (layer.changed) layer.changed();
        });

        atualizarOpcoesFunil(contexto.map);

        const resumo = document.getElementById("resumoFiltrosMapa");
        if (resumo) resumo.textContent = "Filtros limpos";

        if (contexto.map.render) contexto.map.render();
    }

    function limparCamadasMapa() {
        const contexto = obterContextoMapa();
        if (!contexto) {
            alert("O mapa ainda não carregou.");
            return;
        }

        if (contexto.janelaMapa.PONTE_MAP_BRIDGE && contexto.janelaMapa.PONTE_MAP_BRIDGE.limparCamadas) {
            contexto.janelaMapa.PONTE_MAP_BRIDGE.limparCamadas();
        } else {
            obterCamadasVetoriais(contexto.map).forEach(function (layer) {
                prepararBackupsDeFeicoes(contexto.map);
                if (typeof layer.setVisible === "function") layer.setVisible(false);
                if (layer.changed) layer.changed();
            });
        }

        const resumo = document.getElementById("resumoFiltrosMapa");
        if (resumo) resumo.textContent = "Camadas ocultadas";

        if (contexto.map.render) contexto.map.render();
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

        Object.values(SELECTS).forEach(function (id) {
            document.addEventListener("change", function (event) {
                if (!event.target || event.target.id !== id) return;
                if (atualizandoSelects) return;
                aplicarFiltrosMapa();
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

    function exportarMapaPDF() {
        const contexto = obterContextoMapa();
        if (!contexto) {
            alert("Mapa ainda não carregou.");
            return;
        }

        contexto.iframe.contentWindow.focus();
        window.print();
    }

    window.PONTE_MAP_TOOLS = {
        aplicarFiltrosMapa,
        limparFiltrosMapa,
        limparCamadasMapa,
        alternarStreetView,
        exportarMapaPDF,
        preencherFiltros: function () {
            const contexto = obterContextoMapa();
            if (contexto) atualizarOpcoesFunil(contexto.map);
        }
    };
})();

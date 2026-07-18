/* =========================================================
   PONTE MAP BRIDGE
   Controle interno das camadas do qgis2web
   Fica dentro do iframe do mapa e expõe uma API para o PONTE
   ========================================================= */

(function() {
    console.log("ponte-map-bridge.js carregado dentro do mapa - versão sem apagar feições");

    let inicializado = false;

    function obterMapa() {
        if (typeof map !== "undefined") return map;
        if (window.map) return window.map;
        return null;
    }

    function exporMapa() {
        const mapa = obterMapa();
        if (!mapa || !window.ol) return false;

        window.ponteMap = mapa;
        window.ponteOl = window.ol;
        return true;
    }

    function inicializar() {
        if (!exporMapa()) {
            setTimeout(inicializar, 250);
            return;
        }

        if (inicializado) return;
        inicializado = true;

        guardarBackupsIniciais();
        prepararLayerSwitcherPorClique();
        setTimeout(localizarItemDaUrl, 600);
        console.log("PONTE bridge pronto.");
    }

    function normalizar(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
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
            titulo.includes("TERRAIN") ||
            sourceNome.includes("XYZ") ||
            sourceNome.includes("OSM") ||
            sourceNome.includes("TILE")
        );
    }

    function percorrerLayers(layer, callback) {
        if (!layer) return;
        if (layer.getLayers) {
            layer.getLayers().forEach(function(subLayer) {
                percorrerLayers(subLayer, callback);
            });
            return;
        }
        callback(layer);
    }

    function obterListaDeCamadas() {
        if (typeof layersList !== "undefined" && Array.isArray(layersList)) return layersList;
        if (window.layersList && Array.isArray(window.layersList)) return window.layersList;

        const mapa = obterMapa();
        const camadas = [];
        if (!mapa || !mapa.getLayers) return camadas;

        mapa.getLayers().forEach(function(layer) {
            percorrerLayers(layer, function(subLayer) {
                camadas.push(subLayer);
            });
        });

        return camadas;
    }

    function ehCamadaVetorial(layer) {
        if (!layer || ehCamadaBase(layer)) return false;
        const source = layer.getSource ? layer.getSource() : null;
        return source && typeof source.getFeatures === "function";
    }

    function guardarBackupDaCamada(layer) {
        if (!ehCamadaVetorial(layer)) return false;
        const source = layer.getSource();
        const features = source.getFeatures ? source.getFeatures().slice() : [];
        if (!features.length) return false;

        if (!layer.get("ponte_features_backup")) {
            layer.set("ponte_features_backup", features);
        }

        if (!layer.get("ponte_features_original")) {
            layer.set("ponte_features_original", features);
        }

        return true;
    }

    function guardarBackupsIniciais() {
        obterListaDeCamadas().forEach(guardarBackupDaCamada);
    }

    function restaurarCamada(layer) {
        if (!ehCamadaVetorial(layer)) return false;

        const source = layer.getSource();
        const backup = layer.get("ponte_features_backup") || layer.get("ponte_features_original");

        if (backup && backup.length && source.getFeatures && source.getFeatures().length === 0 && source.addFeatures) {
            source.addFeatures(backup);
        }

        if (typeof layer.changed === "function") layer.changed();
        return true;
    }

    function limparCamadas() {
        const mapa = obterMapa();
        if (!mapa) {
            console.error("Mapa não encontrado dentro do iframe.");
            return 0;
        }

        guardarBackupsIniciais();

        let total = 0;
        obterListaDeCamadas().forEach(function(layer) {
            if (!ehCamadaVetorial(layer)) return;
            restaurarCamada(layer);
            if (typeof layer.setVisible === "function") {
                layer.setVisible(false);
                total++;
            }
            if (typeof layer.changed === "function") layer.changed();
        });

        atualizarCheckboxes(false);
        if (typeof mapa.render === "function") mapa.render();
        if (typeof mapa.renderSync === "function") mapa.renderSync();

        console.log("Camadas ocultadas pelo bridge:", total);
        return total;
    }

    function atualizarCheckboxes(marcado) {
        const checkboxes = document.querySelectorAll(".layer-switcher input[type='checkbox'], input[type='checkbox']");
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = marcado;
            if (marcado) checkbox.setAttribute("checked", "checked");
            else checkbox.removeAttribute("checked");
        });
    }

    function sincronizarTodasAsCamadas() {
        guardarBackupsIniciais();
        obterListaDeCamadas().forEach(function(layer) {
            if (!ehCamadaVetorial(layer)) return;
            if (layer.getVisible && layer.getVisible()) restaurarCamada(layer);
        });

        const mapa = obterMapa();
        if (mapa && typeof mapa.render === "function") mapa.render();
    }

    function prepararLayerSwitcherPorClique() {
        const aplicar = function() {
            const painel = document.querySelector(".layer-switcher");
            if (!painel || painel.getAttribute("data-ponte-click") === "1") return;

            painel.setAttribute("data-ponte-click", "1");
            painel.classList.add("ponte-layer-switcher-click");

            painel.addEventListener("click", function(evt) {
                if (evt.target && evt.target.tagName && ["INPUT", "LABEL"].includes(evt.target.tagName.toUpperCase())) return;
                painel.classList.toggle("shown");
            });
        };

        aplicar();
        setTimeout(aplicar, 500);
        setTimeout(aplicar, 1500);
    }


    function valorCampoFeature(properties, campo) {
        if (!properties || !campo) return "";
        if (properties[campo] !== undefined && properties[campo] !== null) return String(properties[campo]);

        const alvo = normalizar(campo);
        const chave = Object.keys(properties).find(k => normalizar(k) === alvo);
        if (!chave) return "";
        return properties[chave] !== undefined && properties[chave] !== null ? String(properties[chave]) : "";
    }

    function localizarItemDaUrl() {
        const params = new URLSearchParams(window.location.search);
        const campo = params.get("ponteCampo") || "";
        const valor = params.get("ponteValor") || "";
        const camadaFiltro = params.get("ponteLayer") || "";

        if (!campo || !valor) return false;

        const mapa = obterMapa();
        if (!mapa || !window.ol) return false;

        guardarBackupsIniciais();

        const alvo = normalizar(valor);
        let encontrado = null;
        let layerEncontrada = null;

        obterListaDeCamadas().forEach(function(layer) {
            if (encontrado || !ehCamadaVetorial(layer)) return;

            const titulo = normalizar(layer.get("popuplayertitle") || layer.get("title") || layer.get("name") || "");
            if (camadaFiltro && normalizar(camadaFiltro) !== "TODAS" && !titulo.includes(normalizar(camadaFiltro))) return;

            restaurarCamada(layer);
            const source = layer.getSource();
            const features = source && source.getFeatures ? source.getFeatures() : [];

            features.forEach(function(feature) {
                if (encontrado) return;
                const props = feature.getProperties ? feature.getProperties() : {};
                const valorFeature = valorCampoFeature(props, campo);
                if (normalizar(valorFeature) === alvo) {
                    encontrado = feature;
                    layerEncontrada = layer;
                }
            });
        });

        if (!encontrado || !layerEncontrada) {
            console.warn("PONTE: item não encontrado no mapa", { campo, valor, camadaFiltro });
            return false;
        }

        if (typeof layerEncontrada.setVisible === "function") layerEncontrada.setVisible(true);
        restaurarCamada(layerEncontrada);

        const geom = encontrado.getGeometry && encontrado.getGeometry();
        if (geom) {
            mapa.getView().fit(geom.getExtent(), {
                padding: [90, 90, 90, 90],
                maxZoom: 20,
                duration: 900
            });
        }

        if (typeof mapa.render === "function") mapa.render();
        console.log("PONTE: item localizado no mapa", { campo, valor });
        return true;
    }

    function listarCamadas() {
        const camadas = obterListaDeCamadas();
        console.log("Quantidade de camadas:", camadas.length);
        camadas.forEach(function(layer, index) {
            const source = layer.getSource ? layer.getSource() : null;
            console.log({
                indice: index,
                titulo: layer.get("title"),
                nome: layer.get("name"),
                visivel: layer.getVisible ? layer.getVisible() : null,
                quantidadeFeatures: source && source.getFeatures ? source.getFeatures().length : null,
                backupFeatures: layer.get("ponte_features_backup") ? layer.get("ponte_features_backup").length : null,
                ehBase: ehCamadaBase(layer),
                ehVetorial: ehCamadaVetorial(layer),
                source: source && source.constructor ? source.constructor.name : null
            });
        });
    }

    window.PONTE_MAP_BRIDGE = {
        limparCamadas,
        listarCamadas,
        sincronizarTodasAsCamadas,
        restaurarCamada,
        localizarItemDaUrl
    };

    inicializar();
})();

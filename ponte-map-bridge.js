/* =========================================================
   PONTE MAP BRIDGE
   Controle interno das camadas do qgis2web
   Funciona sem editar o index.html do mapa
   ========================================================= */

(function() {

    console.log("ponte-map-bridge.js carregado dentro do mapa");

    let sincronizadorAtivo = false;

    function obterMapa() {
        if (typeof map !== "undefined") {
            return map;
        }

        if (window.map) {
            return window.map;
        }

        return null;
    }

    function ehCamadaBase(layer) {
        const titulo = String(
            layer.get("title") ||
            layer.get("name") ||
            ""
        ).toLowerCase();

        const source = layer.getSource ? layer.getSource() : null;

        if (
            titulo.includes("google") ||
            titulo.includes("satellite") ||
            titulo.includes("hybrid") ||
            titulo.includes("osm") ||
            titulo.includes("openstreetmap") ||
            titulo.includes("bing") ||
            titulo.includes("base") ||
            titulo.includes("terrain") ||
            titulo.includes("terreno")
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

    function obterListaDeCamadas() {
        if (typeof layersList !== "undefined" && Array.isArray(layersList)) {
            return layersList;
        }

        if (window.layersList && Array.isArray(window.layersList)) {
            return window.layersList;
        }

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

    function ehCamadaVetorial(layer) {
        if (!layer || ehCamadaBase(layer)) return false;

        const source = layer.getSource ? layer.getSource() : null;

        return (
            source &&
            typeof source.getFeatures === "function" &&
            typeof source.clear === "function" &&
            typeof source.addFeatures === "function"
        );
    }

    function guardarBackupDaCamada(layer) {
        if (!ehCamadaVetorial(layer)) return false;

        const source = layer.getSource();

        if (!layer.get("ponte_features_backup")) {
            layer.set("ponte_features_backup", source.getFeatures().slice());
        }

        if (layer.get("ponte_opacidade_original") === undefined) {
            const opacidade = typeof layer.getOpacity === "function"
                ? layer.getOpacity()
                : 1;

            layer.set("ponte_opacidade_original", opacidade);
        }

        return true;
    }

    function esvaziarCamada(layer) {
        if (!guardarBackupDaCamada(layer)) return false;

        const source = layer.getSource();

        source.clear(true);

        if (typeof layer.setVisible === "function") {
            layer.setVisible(false);
        }

        if (typeof layer.setOpacity === "function") {
            layer.setOpacity(1);
        }

        if (typeof layer.changed === "function") {
            layer.changed();
        }

        return true;
    }

    function restaurarCamada(layer) {
        if (!ehCamadaVetorial(layer)) return false;

        const source = layer.getSource();
        const backup = layer.get("ponte_features_backup");

        if (!backup || !backup.length) return false;

        if (source.getFeatures().length === 0) {
            source.addFeatures(backup);
        }

        const opacidadeOriginal = layer.get("ponte_opacidade_original");

        if (typeof layer.setOpacity === "function") {
            layer.setOpacity(
                opacidadeOriginal !== undefined ? opacidadeOriginal : 1
            );
        }

        if (typeof layer.changed === "function") {
            layer.changed();
        }

        return true;
    }

    function limparCamadas() {
        const mapa = obterMapa();

        if (!mapa) {
            console.error("Mapa não encontrado dentro do iframe.");
            return 0;
        }

        const camadas = obterListaDeCamadas();

        let total = 0;

        camadas.forEach(function(layer) {
            if (esvaziarCamada(layer)) {
                total++;
            }
        });

        atualizarCheckboxes(false);
        ativarSincronizador();

        if (typeof mapa.render === "function") {
            mapa.render();
        }

        if (typeof mapa.renderSync === "function") {
            mapa.renderSync();
        }

        console.log("Camadas esvaziadas pelo bridge:", total);

        return total;
    }

    function atualizarCheckboxes(marcado) {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");

        checkboxes.forEach(function(checkbox) {
            checkbox.checked = marcado;
            checkbox.removeAttribute("checked");
        });
    }

    function ativarSincronizador() {
        if (sincronizadorAtivo) return;

        sincronizadorAtivo = true;

        const camadas = obterListaDeCamadas();

        camadas.forEach(function(layer) {
            if (!ehCamadaVetorial(layer)) return;

            if (layer.get("ponte_sync_ativo") === true) return;

            layer.set("ponte_sync_ativo", true);

            if (typeof layer.on === "function") {
                layer.on("change:visible", function() {
                    sincronizarCamada(layer);
                });
            }
        });

        setInterval(function() {
            sincronizarTodasAsCamadas();
        }, 700);

        observarCheckboxes();
    }

    function sincronizarTodasAsCamadas() {
        const mapa = obterMapa();
        const camadas = obterListaDeCamadas();

        camadas.forEach(function(layer) {
            sincronizarCamada(layer);
        });

        if (mapa && typeof mapa.render === "function") {
            mapa.render();
        }
    }

    function sincronizarCamada(layer) {
        if (!ehCamadaVetorial(layer)) return;

        const visivel = layer.getVisible ? layer.getVisible() : true;

        if (visivel) {
            restaurarCamada(layer);
        } else {
            const source = layer.getSource();

            if (source.getFeatures().length > 0) {
                esvaziarCamada(layer);
            }
        }
    }

    function observarCheckboxes() {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");

        checkboxes.forEach(function(checkbox) {
            if (checkbox.getAttribute("data-ponte-sync") === "1") return;

            checkbox.setAttribute("data-ponte-sync", "1");

            checkbox.addEventListener("change", function() {
                setTimeout(function() {
                    sincronizarTodasAsCamadas();
                }, 150);
            });

            checkbox.addEventListener("click", function() {
                setTimeout(function() {
                    sincronizarTodasAsCamadas();
                }, 150);
            });
        });
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
                backupFeatures: layer.get("ponte_features_backup")
                    ? layer.get("ponte_features_backup").length
                    : null,
                ehBase: ehCamadaBase(layer),
                ehVetorial: ehCamadaVetorial(layer),
                source: source && source.constructor ? source.constructor.name : null
            });
        });
    }

    window.PONTE_MAP_BRIDGE = {
        limparCamadas: limparCamadas,
        listarCamadas: listarCamadas,
        sincronizarTodasAsCamadas: sincronizarTodasAsCamadas
    };

})();

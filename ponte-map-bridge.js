/* =========================================================
   PONTE MAP BRIDGE
   Este arquivo roda dentro do iframe do qgis2web
   ========================================================= */

(function() {

    console.log("ponte-map-bridge.js carregado dentro do mapa");

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

    function obterTodasAsCamadas() {
        const mapa = obterMapa();
        const camadas = [];

        if (!mapa) return camadas;

        if (typeof mapa.getAllLayers === "function") {
            mapa.getAllLayers().forEach(function(layer) {
                camadas.push(layer);
            });

            return camadas;
        }

        mapa.getLayers().forEach(function(layer) {
            percorrerLayers(layer, function(subLayer) {
                camadas.push(subLayer);
            });
        });

        return camadas;
    }

    function guardarOpacidadeOriginal(layer) {
        if (layer.get("ponte_opacidade_original") === undefined) {
            const opacidade = typeof layer.getOpacity === "function"
                ? layer.getOpacity()
                : 1;

            layer.set("ponte_opacidade_original", opacidade);
        }
    }

    function esconderLayer(layer) {
        if (!layer || ehCamadaBase(layer)) return false;

        guardarOpacidadeOriginal(layer);

        if (typeof layer.setVisible === "function") {
            layer.setVisible(false);
        }

        if (typeof layer.setOpacity === "function") {
            layer.setOpacity(0);
        }

        if (typeof layer.changed === "function") {
            layer.changed();
        }

        return true;
    }

    function mostrarLayer(layer) {
        if (!layer || ehCamadaBase(layer)) return false;

        const opacidadeOriginal = layer.get("ponte_opacidade_original");

        if (typeof layer.setVisible === "function") {
            layer.setVisible(true);
        }

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

        let total = 0;

        const camadas = obterTodasAsCamadas();

        camadas.forEach(function(layer) {
            if (esconderLayer(layer)) {
                total++;
            }
        });

        Object.keys(window).forEach(function(nomeVariavel) {
            if (!nomeVariavel.startsWith("lyr_")) return;

            const layer = window[nomeVariavel];

            if (!layer || typeof layer.setVisible !== "function") return;

            esconderLayer(layer);
        });

        atualizarCheckboxes(false);

        if (typeof mapa.render === "function") {
            mapa.render();
        }

        if (typeof mapa.renderSync === "function") {
            mapa.renderSync();
        }

        console.log("Camadas limpas pelo bridge:", total);

        return total;
    }

    function atualizarCheckboxes(marcado) {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");

        checkboxes.forEach(function(checkbox) {
            checkbox.checked = marcado;
        });
    }

    function tentarSincronizarCheckboxesComCamadas() {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");

        checkboxes.forEach(function(checkbox) {
            if (checkbox.getAttribute("data-ponte-sync") === "1") return;

            checkbox.setAttribute("data-ponte-sync", "1");

            checkbox.addEventListener("change", function() {
                setTimeout(function() {
                    restaurarOpacidadeDasCamadasMarcadas();
                }, 100);
            });
        });
    }

    function restaurarOpacidadeDasCamadasMarcadas() {
        const mapa = obterMapa();

        if (!mapa) return;

        const camadas = obterTodasAsCamadas();

        camadas.forEach(function(layer) {
            if (layer.getVisible && layer.getVisible()) {
                const opacidadeOriginal = layer.get("ponte_opacidade_original");

                if (typeof layer.setOpacity === "function") {
                    layer.setOpacity(
                        opacidadeOriginal !== undefined ? opacidadeOriginal : 1
                    );
                }

                if (typeof layer.changed === "function") {
                    layer.changed();
                }
            }
        });

        if (typeof mapa.render === "function") {
            mapa.render();
        }
    }

    function listarCamadas() {
        const mapa = obterMapa();

        if (!mapa) {
            console.error("Mapa não encontrado.");
            return;
        }

        console.log("Camadas encontradas no mapa:");

        obterTodasAsCamadas().forEach(function(layer, index) {
            const source = layer.getSource ? layer.getSource() : null;

            console.log({
                indice: index,
                titulo: layer.get("title"),
                nome: layer.get("name"),
                visivel: layer.getVisible ? layer.getVisible() : null,
                opacidade: layer.getOpacity ? layer.getOpacity() : null,
                ehBase: ehCamadaBase(layer),
                source: source && source.constructor ? source.constructor.name : null
            });
        });
    }

    setInterval(tentarSincronizarCheckboxesComCamadas, 1000);

    window.PONTE_MAP_BRIDGE = {
        limparCamadas: limparCamadas,
        listarCamadas: listarCamadas,
        restaurarOpacidadeDasCamadasMarcadas: restaurarOpacidadeDasCamadasMarcadas
    };

})();

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

    function limparCamadas() {
        const mapa = obterMapa();

        if (!mapa) {
            console.error("Mapa não encontrado dentro do iframe.");
            return 0;
        }

        let total = 0;

        mapa.getLayers().forEach(function(layer) {
            percorrerLayers(layer, function(subLayer) {
                if (ehCamadaBase(subLayer)) return;

                if (typeof subLayer.setVisible === "function") {
                    subLayer.setVisible(false);

                    if (typeof subLayer.changed === "function") {
                        subLayer.changed();
                    }

                    total++;
                }
            });
        });

        /* Tenta também pelas variáveis lyr_ do qgis2web */
        Object.keys(window).forEach(function(nomeVariavel) {
            if (!nomeVariavel.startsWith("lyr_")) return;

            const layer = window[nomeVariavel];

            if (!layer || typeof layer.setVisible !== "function") return;

            if (ehCamadaBase(layer)) return;

            layer.setVisible(false);

            if (typeof layer.changed === "function") {
                layer.changed();
            }
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

    function listarCamadas() {
        const mapa = obterMapa();

        if (!mapa) {
            console.error("Mapa não encontrado.");
            return;
        }

        console.log("Camadas encontradas no mapa:");

        mapa.getLayers().forEach(function(layer, index) {
            percorrerLayers(layer, function(subLayer) {
                const source = subLayer.getSource ? subLayer.getSource() : null;

                console.log({
                    indice: index,
                    titulo: subLayer.get("title"),
                    nome: subLayer.get("name"),
                    visivel: subLayer.getVisible ? subLayer.getVisible() : null,
                    source: source && source.constructor ? source.constructor.name : null
                });
            });
        });
    }

    window.PONTE_MAP_BRIDGE = {
        limparCamadas: limparCamadas,
        listarCamadas: listarCamadas
    };

})();

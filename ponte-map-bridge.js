/* =========================================================
   PONTE MAP BRIDGE
   Controle interno das camadas do qgis2web
   ========================================================= */

(function() {

    console.log("ponte-map-bridge.js carregado dentro do mapa");

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
        let camadas = [];

        /*
           O qgis2web normalmente cria uma lista global chamada layersList.
           Ela é mais confiável que percorrer o map.getLayers().
        */
        if (typeof layersList !== "undefined" && Array.isArray(layersList)) {
            camadas = layersList;
        } else if (window.layersList && Array.isArray(window.layersList)) {
            camadas = window.layersList;
        }

        return camadas;
    }

    function desligarCamada(layer) {
        if (!layer) return false;

        if (ehCamadaBase(layer)) {
            return false;
        }

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

    function limparCamadas() {
        let total = 0;

        const camadas = obterListaDeCamadas();

        if (!camadas.length) {
            console.warn("layersList não encontrada. Tentando fallback pelo map.");

            if (typeof map !== "undefined" && map.getLayers) {
                map.getLayers().forEach(function(layer) {
                    if (desligarCamada(layer)) {
                        total++;
                    }
                });
            }
        } else {
            camadas.forEach(function(layer) {
                if (desligarCamada(layer)) {
                    total++;
                }
            });
        }

        atualizarCheckboxes(false);
        atualizarPainelDoLayerSwitcher();

        if (typeof map !== "undefined") {
            if (typeof map.render === "function") {
                map.render();
            }

            if (typeof map.renderSync === "function") {
                map.renderSync();
            }
        }

        console.log("Camadas limpas pelo layersList:", total);

        return total;
    }

    function atualizarCheckboxes(marcado) {
        const checkboxes = document.querySelectorAll("input[type='checkbox']");

        checkboxes.forEach(function(checkbox) {
            checkbox.checked = marcado;
            checkbox.removeAttribute("checked");

            checkbox.dispatchEvent(new Event("change", {
                bubbles: true
            }));
        });
    }

    function atualizarPainelDoLayerSwitcher() {
        /*
           O qgis2web costuma criar a variável layerSwitcher.
           Esse comando força o painel a se redesenhar depois do setVisible(false).
        */
        try {
            if (
                typeof layerSwitcher !== "undefined" &&
                layerSwitcher &&
                typeof layerSwitcher.renderPanel === "function"
            ) {
                layerSwitcher.renderPanel();
            }

            if (
                window.layerSwitcher &&
                typeof window.layerSwitcher.renderPanel === "function"
            ) {
                window.layerSwitcher.renderPanel();
            }
        } catch (erro) {
            console.warn("Não foi possível atualizar o layerSwitcher:", erro);
        }
    }

    function listarCamadas() {
        const camadas = obterListaDeCamadas();

        console.log("layersList encontrada?", camadas.length > 0);
        console.log("Quantidade de camadas:", camadas.length);

        camadas.forEach(function(layer, index) {
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

    window.PONTE_MAP_BRIDGE = {
        limparCamadas: limparCamadas,
        listarCamadas: listarCamadas
    };

})();

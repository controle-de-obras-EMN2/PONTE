/* =========================================================
   PONTE MAP TOOLS
   Filtros em funil, Street View, exportação PDF e limpar camadas
   Arquivo externo ao qgis2web para preservar melhorias do PONTE
   ========================================================= */

console.log("ponte-map-tools.js carregado - multifiltro de frentes 2026-07-28");

(function () {
    const CAMPOS = {
        contrato: ["NUM_CONTRA", "Contrato_N", "CONTRATO", "Contrato", "contrato"],
        frente: ["FRENTE", "Frente", "frente", "OBRA", "Nome_Lanca", "EEE"],
        metodo: ["DETA_METOD"],
        diametro: ["DIAMETR_MM", "Diametro", "DIAMETRO", "diametro"]
    };

    const SELECTS = {
        contrato: "filtroMapaContrato",
        metodo: "filtroMapaMetodo",
        diametro: "filtroMapaDiametro"
    };

    const FRENTE_MULTI = {
        box: "filtroMapaFrenteBox",
        btn: "filtroMapaFrenteBtn",
        menu: "filtroMapaFrenteMenu",
        busca: "filtroMapaFrenteBusca",
        opcoes: "filtroMapaFrenteOpcoes",
        marcarTodos: "filtroMapaFrenteMarcarTodos",
        limpar: "filtroMapaFrenteLimpar",
        fechar: "filtroMapaFrenteFechar"
    };

    const LABELS = {
        contrato: "Todos os contratos",
        frente: "Todas as frentes",
        metodo: "Todos os métodos",
        diametro: "Todos os diâmetros"
    };

    let mapReadyTentativas = 0;
    let streetViewAtivo = false;
    let atualizandoSelects = false;
    let zoomParametroAplicado = false;
    let frentesSelecionadas = new Set();

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
        instalarMultiselectFrente();
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

        const totalFeatures = obterRegistrosFiltravel(contexto.map).length;
        if (!totalFeatures) {
            repetirAguardando("PONTE: aguardando feições do mapa para montar filtros.");
            return;
        }

        atualizarOpcoesFunil(contexto.map);
        instalarCliqueStreetView(contexto);
        aplicarZoomDeParametroURL(contexto);
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

    function valorValidoParaFiltro(valor) {
        const n = normalizar(valor).replace(/\s+/g, " ");
        const invalidos = [
            "NAO INFORMADO", "NAO DISPONIVEL", "N/A", "NA", "N.A", "N.D", "N.D.",
            "ND", "NULL", "-", "0", "SEM INFORMACAO", "SEM INFORMAÇÃO", "VAZIO"
        ];
        if (!n || invalidos.includes(n)) return false;
        if (n.includes("NAO INFORMADO") || n.includes("NAO DISPONIVEL")) return false;
        return true;
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
        const direto = obterValorCampo(properties, CAMPOS[tipo] || []);
        if (direto) return direto;

        return "";
    }

    function obterRegistrosFiltravel(map) {
        const registros = [];

        obterCamadasVetoriais(map).forEach(function (layer) {
            const source = layer.getSource();
            const features = layer.get("ponte_features_original") || source.getFeatures() || [];
            const titulo = textoLimpo(layer.get("popuplayertitle") || layer.get("title") || layer.get("name") || "");

            features.forEach(function (feature) {
                const props = feature.getProperties ? feature.getProperties() : {};
                registros.push({ layer, feature, props, titulo });
            });
        });

        return registros;
    }

    function obterFrentesSelecionadas() {
        const opcoes = document.getElementById(FRENTE_MULTI.opcoes);
        if (!opcoes) return Array.from(frentesSelecionadas);

        return Array.from(opcoes.querySelectorAll("input[data-frente-valor]:checked"))
            .map(input => input.getAttribute("data-frente-valor"))
            .filter(Boolean);
    }

    function obterFiltrosAtuais() {
        return {
            contrato: document.getElementById(SELECTS.contrato)?.value || "",
            frente: obterFrentesSelecionadas(),
            metodo: document.getElementById(SELECTS.metodo)?.value || "",
            diametro: document.getElementById(SELECTS.diametro)?.value || ""
        };
    }

    function valorFiltroAtendido(valorRegistro, valorFiltro) {
        if (Array.isArray(valorFiltro)) {
            if (!valorFiltro.length) return true;
            const selecionados = new Set(valorFiltro.map(normalizar));
            return selecionados.has(normalizar(valorRegistro));
        }

        if (!valorFiltro) return true;
        return normalizar(valorRegistro) === normalizar(valorFiltro);
    }

    function haFiltrosAtivos(filtros) {
        return Object.values(filtros || {}).some(function(valor) {
            return Array.isArray(valor) ? valor.length > 0 : Boolean(valor);
        });
    }

    function registroAtendeFiltros(registro, filtros, ignorarTipo) {
        return ["contrato", "frente", "metodo", "diametro"].every(function (tipo) {
            if (tipo === ignorarTipo) return true;

            const valorFiltro = filtros[tipo];
            const valorRegistro = valorTipo(registro.props, tipo);
            return valorFiltroAtendido(valorRegistro, valorFiltro);
        });
    }

    function coletarValoresFiltrados(map, tipo, filtros) {
        const valores = new Set();

        obterRegistrosFiltravel(map).forEach(function (registro) {
            if (!registroAtendeFiltros(registro, filtros, tipo)) return;
            const valor = valorTipo(registro.props, tipo);
            if (!valor) return;
            if (tipo === "metodo" && !valorValidoParaFiltro(valor)) return;
            if (tipo === "diametro" && !valorValidoParaFiltro(valor)) return;
            valores.add(valor);
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

    function atualizarTextoBotaoFrente() {
        const btn = document.getElementById(FRENTE_MULTI.btn);
        if (!btn) return;

        const selecionadas = Array.from(frentesSelecionadas);
        if (!selecionadas.length) {
            btn.textContent = LABELS.frente;
        } else if (selecionadas.length === 1) {
            btn.textContent = selecionadas[0];
        } else {
            btn.textContent = `${selecionadas.length} frentes selecionadas`;
        }
    }

    function aplicarBuscaFrentes() {
        const busca = normalizar(document.getElementById(FRENTE_MULTI.busca)?.value || "");
        const opcoes = document.getElementById(FRENTE_MULTI.opcoes);
        if (!opcoes) return;

        opcoes.querySelectorAll(".ponte-multiselect-item").forEach(function(label) {
            const texto = normalizar(label.textContent || "");
            label.style.display = (!busca || texto.includes(busca)) ? "flex" : "none";
        });
    }

    function preencherMultiselectFrente(valores, selecionadasAtuais) {
        const opcoes = document.getElementById(FRENTE_MULTI.opcoes);
        if (!opcoes) return [];

        const selecionadasNorm = new Set((selecionadasAtuais || []).map(normalizar));
        const selecionadasMantidas = valores.filter(valor => selecionadasNorm.has(normalizar(valor)));
        frentesSelecionadas = new Set(selecionadasMantidas);

        opcoes.innerHTML = "";

        if (!valores.length) {
            const vazio = document.createElement("div");
            vazio.className = "ponte-multiselect-vazio";
            vazio.textContent = "Nenhuma frente disponível para o recorte atual";
            opcoes.appendChild(vazio);
            atualizarTextoBotaoFrente();
            return selecionadasMantidas;
        }

        valores.forEach(function(valor, indice) {
            const id = `filtroMapaFrenteOpcao_${indice}`;
            const label = document.createElement("label");
            label.className = "ponte-multiselect-item";
            label.setAttribute("for", id);

            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = id;
            input.setAttribute("data-frente-valor", valor);
            input.checked = frentesSelecionadas.has(valor);

            const span = document.createElement("span");
            span.textContent = valor;
            span.title = valor;

            label.appendChild(input);
            label.appendChild(span);
            opcoes.appendChild(label);
        });

        atualizarTextoBotaoFrente();
        aplicarBuscaFrentes();
        return selecionadasMantidas;
    }

    function instalarMultiselectFrente() {
        const box = document.getElementById(FRENTE_MULTI.box);
        const btn = document.getElementById(FRENTE_MULTI.btn);
        const opcoes = document.getElementById(FRENTE_MULTI.opcoes);
        if (!box || !btn || !opcoes || box.getAttribute("data-ponte-instalado") === "1") return;
        box.setAttribute("data-ponte-instalado", "1");

        btn.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            const aberto = box.classList.toggle("aberto");
            btn.setAttribute("aria-expanded", aberto ? "true" : "false");
            if (aberto) setTimeout(() => document.getElementById(FRENTE_MULTI.busca)?.focus(), 50);
        });

        document.getElementById(FRENTE_MULTI.fechar)?.addEventListener("click", function(event) {
            event.preventDefault();
            box.classList.remove("aberto");
            btn.setAttribute("aria-expanded", "false");
        });

        document.getElementById(FRENTE_MULTI.busca)?.addEventListener("input", aplicarBuscaFrentes);

        document.getElementById(FRENTE_MULTI.limpar)?.addEventListener("click", function(event) {
            event.preventDefault();
            frentesSelecionadas = new Set();
            opcoes.querySelectorAll("input[data-frente-valor]").forEach(input => input.checked = false);
            atualizarTextoBotaoFrente();
            if (!atualizandoSelects) aplicarFiltrosMapa();
        });

        document.getElementById(FRENTE_MULTI.marcarTodos)?.addEventListener("click", function(event) {
            event.preventDefault();
            opcoes.querySelectorAll(".ponte-multiselect-item").forEach(function(label) {
                if (label.style.display === "none") return;
                const input = label.querySelector("input[data-frente-valor]");
                if (input) input.checked = true;
            });
            frentesSelecionadas = new Set(obterFrentesSelecionadas());
            atualizarTextoBotaoFrente();
            if (!atualizandoSelects) aplicarFiltrosMapa();
        });

        opcoes.addEventListener("change", function(event) {
            if (!event.target || !event.target.matches("input[data-frente-valor]")) return;
            frentesSelecionadas = new Set(obterFrentesSelecionadas());
            atualizarTextoBotaoFrente();
            if (!atualizandoSelects) aplicarFiltrosMapa();
        });

        document.addEventListener("click", function(event) {
            if (!box.contains(event.target)) {
                box.classList.remove("aberto");
                btn.setAttribute("aria-expanded", "false");
            }
        });
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

        ["contrato", "frente", "metodo", "diametro"].forEach(function (tipo) {
            const valores = coletarValoresFiltrados(map, tipo, filtros);
            if (tipo === "frente") {
                filtros.frente = preencherMultiselectFrente(valores, filtros.frente);
            } else {
                filtros[tipo] = preencherSelect(SELECTS[tipo], valores, LABELS[tipo], filtros[tipo]);
            }
        });

        atualizandoSelects = false;
    }

    function featureAtendeFiltros(feature, filtros) {
        const props = feature.getProperties ? feature.getProperties() : {};

        return ["contrato", "frente", "metodo", "diametro"].every(function (tipo) {
            const valorFiltro = filtros[tipo];
            const valorFeature = valorTipo(props, tipo);
            return valorFiltroAtendido(valorFeature, valorFiltro);
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
                return featureAtendeFiltros(feature, filtros);
            });

            source.clear(true);
            if (filtradas.length) {
                source.addFeatures(filtradas);
                if (typeof layer.setVisible === "function") layer.setVisible(true);
            } else {
                if (haFiltrosAtivos(filtros) && typeof layer.setVisible === "function") {
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

        ["contrato", "metodo", "diametro"].forEach(function (tipo) {
            const el = document.getElementById(SELECTS[tipo]);
            if (el) el.value = "";
        });

        frentesSelecionadas = new Set();
        const opcoesFrente = document.getElementById(FRENTE_MULTI.opcoes);
        if (opcoesFrente) {
            opcoesFrente.querySelectorAll("input[data-frente-valor]").forEach(input => input.checked = false);
        }
        const buscaFrente = document.getElementById(FRENTE_MULTI.busca);
        if (buscaFrente) buscaFrente.value = "";
        atualizarTextoBotaoFrente();

        obterCamadasVetoriais(contexto.map).forEach(function (layer) {
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original");

            if (todas) {
                source.clear(true);
                source.addFeatures(todas);
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

    function lerParametrosZoom() {
        const params = new URLSearchParams(window.location.search || "");
        const layer = params.get("ponteLayer") || params.get("layer") || "";
        const campo = params.get("ponteCampo") || params.get("campo") || "";
        const valor = params.get("ponteValor") || params.get("valor") || "";
        if (!layer && !campo && !valor) return null;
        return { layer, campo, valor };
    }

    function camadaCombina(layer, alvo) {
        if (!alvo) return true;
        const alvoNorm = normalizar(alvo);
        const titulo = normalizar(layer.get("title") || layer.get("name") || "");
        if (!titulo) return false;
        if (titulo.includes(alvoNorm) || alvoNorm.includes(titulo)) return true;

        const equivalencias = {
            "FRENTES": ["FRENTE", "FRENTES", "FRENTES_9", "FRENTES_10", "EMN2 FRENTES"],
            "OBRAS": ["OBRAS", "OBRAS_EMN2", "OBRA"],
            "EEE": ["EEE", "ELEVATORIA", "ELEVATORIAS"],
            "SINISTRO": ["SINISTRO", "SINISTROEMN2"],
            "PONTOSDELANAMENTO": ["PONTOSDELANAMENTO", "PONTOS DE LANCAMENTO", "PONTOS DE LANÇAMENTO", "LANCAMENTO", "LANÇAMENTO"]
        };

        const chaves = Object.keys(equivalencias);
        for (const chave of chaves) {
            if (!alvoNorm.includes(chave)) continue;
            if (equivalencias[chave].some(nome => titulo.includes(normalizar(nome)))) return true;
        }

        return false;
    }

    function obterValorCampoFlexivel(props, campoSolicitado) {
        if (!props || !campoSolicitado) return "";
        if (props[campoSolicitado] !== undefined && props[campoSolicitado] !== null) return String(props[campoSolicitado]).trim();

        const campoNorm = normalizar(campoSolicitado);
        const chave = Object.keys(props).find(k => normalizar(k) === campoNorm);
        if (chave && props[chave] !== undefined && props[chave] !== null) return String(props[chave]).trim();

        return "";
    }

    function featureCombinaBusca(feature, campo, valor) {
        const props = feature.getProperties ? feature.getProperties() : {};
        const valorNorm = normalizar(valor);
        if (!valorNorm) return false;

        const camposPreferenciais = campo ? [campo] : [];
        camposPreferenciais.push("ID", "FRENTE", "Frente", "NOME_FRENTE", "OBRA", "EEE", "Ficha", "Nome_Lanca", "Nome", "fid", "id");

        for (const c of camposPreferenciais) {
            const v = obterValorCampoFlexivel(props, c);
            if (v && normalizar(v) === valorNorm) return true;
        }

        return Object.keys(props).some(k => normalizar(props[k]) === valorNorm);
    }

    function ajustarMapaParaFeatures(contexto, features) {
        if (!features || !features.length) return false;

        const extent = contexto.ol.extent.createEmpty();
        let pontoUnico = null;
        let totalComGeometria = 0;

        features.forEach(function(feature) {
            const geom = feature.getGeometry && feature.getGeometry();
            if (!geom) return;
            totalComGeometria++;
            contexto.ol.extent.extend(extent, geom.getExtent());
            if (totalComGeometria === 1) pontoUnico = contexto.ol.extent.getCenter(geom.getExtent());
        });

        if (!totalComGeometria || contexto.ol.extent.isEmpty(extent)) return false;

        if (totalComGeometria === 1) {
            const largura = Math.abs(extent[2] - extent[0]);
            const altura = Math.abs(extent[3] - extent[1]);
            if (largura < 2 && altura < 2 && pontoUnico) {
                contexto.map.getView().animate({ center: pontoUnico, zoom: 18, duration: 700 });
                return true;
            }
        }

        contexto.map.getView().fit(extent, {
            padding: [100, 100, 100, 100],
            maxZoom: 18,
            duration: 700
        });
        return true;
    }

    function aplicarZoomDeParametroURL(contexto) {
        if (zoomParametroAplicado) return;
        const busca = lerParametrosZoom();
        if (!busca || !busca.valor) return;

        prepararBackupsDeFeicoes(contexto.map);

        const camadas = obterCamadasVetoriais(contexto.map);
        let encontradas = [];
        let camadasEncontradas = [];

        camadas.forEach(function(layer) {
            if (!camadaCombina(layer, busca.layer)) return;
            const source = layer.getSource();
            const todas = layer.get("ponte_features_original") || (source.getFeatures ? source.getFeatures() : []);
            const match = todas.filter(function(feature) {
                return featureCombinaBusca(feature, busca.campo, busca.valor);
            });
            if (match.length) {
                encontradas = encontradas.concat(match);
                camadasEncontradas.push({ layer, match });
            }
        });

        // Plano B: se o nome da camada mudou no qgis2web, procura em todas as camadas vetoriais.
        if (!encontradas.length) {
            camadas.forEach(function(layer) {
                const source = layer.getSource();
                const todas = layer.get("ponte_features_original") || (source.getFeatures ? source.getFeatures() : []);
                const match = todas.filter(function(feature) {
                    return featureCombinaBusca(feature, busca.campo, busca.valor);
                });
                if (match.length) {
                    encontradas = encontradas.concat(match);
                    camadasEncontradas.push({ layer, match });
                }
            });
        }

        if (!encontradas.length) {
            console.warn("PONTE: não localizou item para zoom", busca);
            return;
        }

        camadasEncontradas.forEach(function(item) {
            const layer = item.layer;
            const source = layer.getSource();
            const atuais = source.getFeatures ? source.getFeatures() : [];
            if (!atuais.length && layer.get("ponte_features_original")) {
                source.addFeatures(layer.get("ponte_features_original"));
            }
            if (typeof layer.setVisible === "function") layer.setVisible(true);
            if (layer.changed) layer.changed();
        });

        setTimeout(function() {
            ajustarMapaParaFeatures(contexto, encontradas);
            const resumo = document.getElementById("resumoFiltrosMapa");
            if (resumo) resumo.textContent = `Zoom aplicado: ${busca.valor}`;
            if (contexto.map.render) contexto.map.render();
        }, 350);

        zoomParametroAplicado = true;
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

    function prepararLayoutImpressaoMapa(contexto) {
        const win = contexto.janelaMapa;
        const doc = win.document;

        let style = doc.getElementById("ponte-print-map-style");
        if (!style) {
            style = doc.createElement("style");
            style.id = "ponte-print-map-style";
            style.textContent = `
                @media print {
                    @page { size: A4 landscape; margin: 6mm; }

                    html, body {
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #ffffff !important;
                    }

                    #map {
                        position: fixed !important;
                        inset: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        page-break-inside: avoid !important;
                    }

                    .ol-control {
                        opacity: 1 !important;
                    }

                    .layer-switcher {
                        display: block !important;
                        position: absolute !important;
                        top: 10px !important;
                        right: 10px !important;
                        max-width: 310px !important;
                        max-height: calc(100vh - 26px) !important;
                        overflow: auto !important;
                        z-index: 99999 !important;
                        background: rgba(255, 255, 255, .96) !important;
                        box-shadow: 0 2px 12px rgba(0,0,0,.25) !important;
                        border-radius: 8px !important;
                        padding: 8px !important;
                    }

                    .layer-switcher > button {
                        display: none !important;
                    }

                    .layer-switcher .panel {
                        display: block !important;
                        position: static !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: transparent !important;
                    }

                    .layer-switcher.shown .panel {
                        display: block !important;
                    }
                }
            `;
            doc.head.appendChild(style);
        }

        const layerSwitcher = doc.querySelector(".layer-switcher");
        if (layerSwitcher) {
            layerSwitcher.classList.add("shown");
            layerSwitcher.style.display = "block";
            layerSwitcher.style.zIndex = "99999";
            const panel = layerSwitcher.querySelector(".panel");
            if (panel) panel.style.display = "block";
        }

        if (contexto.map && contexto.map.updateSize) {
            setTimeout(function() {
                contexto.map.updateSize();
                if (contexto.map.renderSync) contexto.map.renderSync();
                else if (contexto.map.render) contexto.map.render();
            }, 150);
        }
    }

    function exportarMapaPDF() {
        const contexto = obterContextoMapa();
        if (!contexto) {
            alert("Mapa ainda não carregou.");
            return;
        }

        prepararLayoutImpressaoMapa(contexto);

        setTimeout(function() {
            contexto.janelaMapa.focus();
            contexto.janelaMapa.print();
        }, 450);
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
        },
        aplicarZoomDeParametroURL: function () {
            const contexto = obterContextoMapa();
            if (contexto) {
                zoomParametroAplicado = false;
                aplicarZoomDeParametroURL(contexto);
            }
        }
    };
})();

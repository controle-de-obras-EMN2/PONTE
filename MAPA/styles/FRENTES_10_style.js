var size = 0;
var placement = 'point';

function pontePinFrenteSvg(corPrincipal, corContorno) {
    corPrincipal = corPrincipal || "#f2c94c";
    corContorno = corContorno || "#222222";

    var svg = `
    <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="${corPrincipal}"
            stroke="${corContorno}"
            stroke-width="1.2"
        />
        <circle
            cx="12"
            cy="9"
            r="2.6"
            fill="#ffffff"
            stroke="${corContorno}"
            stroke-width="0.7"
        />
    </svg>`;

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function ponteCriarIconeFrente(cor) {
    return new ol.style.Icon({
        imgSize: [32, 32],
        scale: 0.95,
        anchor: [16, 32],
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        rotation: 0,
        src: pontePinFrenteSvg(cor, "#222222")
    });
}

function categories_FRENTES_10(feature, value, size, resolution, labelText,
                       labelFont, labelFill, bufferColor, bufferWidth,
                       placement, textAlign, offsetX, offsetY, overflow, repeat) {

    var valueStr = (value !== null && value !== undefined) ? value.toString().trim().toUpperCase() : 'DEFAULT';

    var cor = "#f2c94c";

    switch (valueStr) {
        case "ADEQUAÇÃO ARSESP":
        case "ADEQUACAO ARSESP":
            cor = "#7b2cbf"; // roxo
            break;

        case "CONCLUÍDO":
        case "CONCLUIDO":
            cor = "#2ecc71"; // verde
            break;

        case "EM ANDAMENTO":
            cor = "#f2c94c"; // amarelo
            break;

        case "PARALISADO SEM GÁS":
        case "PARALISADO SEM GAS":
            cor = "#e74c3c"; // vermelho
            break;

        default:
            cor = "#3498db"; // azul padrão
            break;
    }

    return [new ol.style.Style({
        image: ponteCriarIconeFrente(cor),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth, textAlign, offsetX, offsetY, overflow, repeat)
    })];
}

var style_FRENTES_10 = function(feature, resolution) {
    var context = {
        feature: feature,
        variables: {}
    };

    var labelText = "";
    var value = feature.get("AJUSTE STA");
    var labelFont = "10px, sans-serif";
    var labelFill = "#000000";
    var bufferColor = "";
    var bufferWidth = 0;
    var textAlign = "left";
    var offsetX = 8;
    var offsetY = 3;
    var overflow = false;
    var repeat = 0;
    var placement = "point";

    var style = categories_FRENTES_10(feature, value, size, resolution, labelText,
                          labelFont, labelFill, bufferColor,
                          bufferWidth, placement, textAlign, offsetX, offsetY, overflow, repeat);

    return style;
};

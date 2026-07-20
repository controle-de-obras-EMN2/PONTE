var wms_layers = [];


        var lyr_GoogleSatelliteHybrid_0 = new ol.layer.Tile({
            'title': 'Google Satellite Hybrid',
            'type':'base',
            'opacity': 0.700000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });
var format_COMGS_1 = new ol.format.GeoJSON();
var features_COMGS_1 = format_COMGS_1.readFeatures(json_COMGS_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_COMGS_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_COMGS_1.addFeatures(features_COMGS_1);
var lyr_COMGS_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_COMGS_1, 
                style: style_COMGS_1,
                popuplayertitle: 'COMGÁS',
                interactive: true,
                title: '<img src="styles/legend/COMGS_1.png" /> COMGÁS'
            });
var format_VIRADADEMANCHA_2 = new ol.format.GeoJSON();
var features_VIRADADEMANCHA_2 = format_VIRADADEMANCHA_2.readFeatures(json_VIRADADEMANCHA_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_VIRADADEMANCHA_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_VIRADADEMANCHA_2.addFeatures(features_VIRADADEMANCHA_2);
var lyr_VIRADADEMANCHA_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_VIRADADEMANCHA_2, 
                style: style_VIRADADEMANCHA_2,
                popuplayertitle: 'VIRADA DE MANCHA',
                interactive: true,
    title: 'VIRADA DE MANCHA<br />\
    <img src="styles/legend/VIRADADEMANCHA_2_0.png" /> AZUL<br />\
    <img src="styles/legend/VIRADADEMANCHA_2_1.png" /> VERDE<br />\
    <img src="styles/legend/VIRADADEMANCHA_2_2.png" /> <br />' });
var format_PROJETOBSICO_3 = new ol.format.GeoJSON();
var features_PROJETOBSICO_3 = format_PROJETOBSICO_3.readFeatures(json_PROJETOBSICO_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PROJETOBSICO_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PROJETOBSICO_3.addFeatures(features_PROJETOBSICO_3);
var lyr_PROJETOBSICO_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PROJETOBSICO_3, 
                style: style_PROJETOBSICO_3,
                popuplayertitle: 'PROJETO BÁSICO',
                interactive: true,
                title: '<img src="styles/legend/PROJETOBSICO_3.png" /> PROJETO BÁSICO'
            });
var format_INTEGRA2_4 = new ol.format.GeoJSON();
var features_INTEGRA2_4 = format_INTEGRA2_4.readFeatures(json_INTEGRA2_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_INTEGRA2_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_INTEGRA2_4.addFeatures(features_INTEGRA2_4);
var lyr_INTEGRA2_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_INTEGRA2_4, 
                style: style_INTEGRA2_4,
                popuplayertitle: 'INTEGRA 2',
                interactive: true,
    title: 'INTEGRA 2<br />\
    <img src="styles/legend/INTEGRA2_4_0.png" /> OBRA EM CONTRATAÇÃO<br />\
    <img src="styles/legend/INTEGRA2_4_1.png" /> COM PROJETO BASICO<br />\
    <img src="styles/legend/INTEGRA2_4_2.png" /> SEM PROJETO BASICO<br />' });
var format_OBRAS_EMN2_5 = new ol.format.GeoJSON();
var features_OBRAS_EMN2_5 = format_OBRAS_EMN2_5.readFeatures(json_OBRAS_EMN2_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_OBRAS_EMN2_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_OBRAS_EMN2_5.addFeatures(features_OBRAS_EMN2_5);
var lyr_OBRAS_EMN2_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_OBRAS_EMN2_5, 
                style: style_OBRAS_EMN2_5,
                popuplayertitle: 'OBRAS_EMN2',
                interactive: true,
    title: 'OBRAS_EMN2<br />\
    <img src="styles/legend/OBRAS_EMN2_5_0.png" /> OBRA A INICIAR<br />\
    <img src="styles/legend/OBRAS_EMN2_5_1.png" /> OBRA EM ANDAMENTO<br />\
    <img src="styles/legend/OBRAS_EMN2_5_2.png" /> OBRA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_5_3.png" /> PAVIMENTAÇÃO PROVISÓRIA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_5_4.png" /> PAVIMENTAÇÃO DEFINITIVA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_5_5.png" /> IMOBILIZADO<br />\
    <img src="styles/legend/OBRAS_EMN2_5_6.png" /> SUPRIMIDO<br />\
    <img src="styles/legend/OBRAS_EMN2_5_7.png" /> EXISTENTE<br />' });
var format_ETES_6 = new ol.format.GeoJSON();
var features_ETES_6 = format_ETES_6.readFeatures(json_ETES_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_ETES_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_ETES_6.addFeatures(features_ETES_6);
var lyr_ETES_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_ETES_6, 
                style: style_ETES_6,
                popuplayertitle: 'ETE\'S',
                interactive: true,
                title: '<img src="styles/legend/ETES_6.png" /> ETE\'S'
            });
var format_EEE_7 = new ol.format.GeoJSON();
var features_EEE_7 = format_EEE_7.readFeatures(json_EEE_7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EEE_7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EEE_7.addFeatures(features_EEE_7);
var lyr_EEE_7 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EEE_7, 
                style: style_EEE_7,
                popuplayertitle: 'EEE',
                interactive: true,
    title: 'EEE<br />\
    <img src="styles/legend/EEE_7_0.png" /> A INICIAR<br />\
    <img src="styles/legend/EEE_7_1.png" /> EM CONSTRUÇÃO<br />\
    <img src="styles/legend/EEE_7_2.png" /> SUPRIMIDO<br />' });
var format_SinistroEMN2_8 = new ol.format.GeoJSON();
var features_SinistroEMN2_8 = format_SinistroEMN2_8.readFeatures(json_SinistroEMN2_8, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_SinistroEMN2_8 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_SinistroEMN2_8.addFeatures(features_SinistroEMN2_8);
var lyr_SinistroEMN2_8 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_SinistroEMN2_8, 
                style: style_SinistroEMN2_8,
                popuplayertitle: 'Sinistro-EMN2',
                interactive: true,
                title: '<img src="styles/legend/SinistroEMN2_8.png" /> Sinistro-EMN2'
            });
var format_PONTOSDELANAMENTO_9 = new ol.format.GeoJSON();
var features_PONTOSDELANAMENTO_9 = format_PONTOSDELANAMENTO_9.readFeatures(json_PONTOSDELANAMENTO_9, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PONTOSDELANAMENTO_9 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PONTOSDELANAMENTO_9.addFeatures(features_PONTOSDELANAMENTO_9);
var lyr_PONTOSDELANAMENTO_9 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PONTOSDELANAMENTO_9, 
                style: style_PONTOSDELANAMENTO_9,
                popuplayertitle: 'PONTOS DE LANÇAMENTO',
                interactive: true,
    title: 'PONTOS DE LANÇAMENTO<br />\
    <img src="styles/legend/PONTOSDELANAMENTO_9_0.png" /> ATIVO<br />\
    <img src="styles/legend/PONTOSDELANAMENTO_9_1.png" /> ELIMINADO<br />' });
var format_FRENTES_10 = new ol.format.GeoJSON();
var features_FRENTES_10 = format_FRENTES_10.readFeatures(json_FRENTES_10, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_FRENTES_10 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_FRENTES_10.addFeatures(features_FRENTES_10);
var lyr_FRENTES_10 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_FRENTES_10, 
                style: style_FRENTES_10,
                popuplayertitle: 'FRENTES',
                interactive: true,
    title: 'FRENTES<br />\
    <img src="styles/legend/FRENTES_10_0.png" /> ADEQUAÇÃO ARSESP<br />\
    <img src="styles/legend/FRENTES_10_1.png" /> CONCLUÍDO<br />\
    <img src="styles/legend/FRENTES_10_2.png" /> EM ANDAMENTO<br />\
    <img src="styles/legend/FRENTES_10_3.png" /> PARALISADO SEM GÁS<br />' });

lyr_GoogleSatelliteHybrid_0.setVisible(true);lyr_COMGS_1.setVisible(true);lyr_VIRADADEMANCHA_2.setVisible(true);lyr_PROJETOBSICO_3.setVisible(true);lyr_INTEGRA2_4.setVisible(true);lyr_OBRAS_EMN2_5.setVisible(true);lyr_ETES_6.setVisible(true);lyr_EEE_7.setVisible(true);lyr_SinistroEMN2_8.setVisible(true);lyr_PONTOSDELANAMENTO_9.setVisible(true);lyr_FRENTES_10.setVisible(true);
var layersList = [lyr_GoogleSatelliteHybrid_0,lyr_COMGS_1,lyr_VIRADADEMANCHA_2,lyr_PROJETOBSICO_3,lyr_INTEGRA2_4,lyr_OBRAS_EMN2_5,lyr_ETES_6,lyr_EEE_7,lyr_SinistroEMN2_8,lyr_PONTOSDELANAMENTO_9,lyr_FRENTES_10];
lyr_COMGS_1.set('fieldAliases', {'FME_GEOMET': 'FME_GEOMET', 'ID': 'ID', 'U_DATA': 'U_DATA', });
lyr_VIRADADEMANCHA_2.set('fieldAliases', {'NOME': 'NOME', 'DATA_INSER': 'DATA_INSER', 'COORDENACA': 'COORDENACA', 'COR_MANCHA': 'COR_MANCHA', 'ECON_FTU': 'ECON_FTU', 'ECON_CONT': 'ECON_CONT', });
lyr_PROJETOBSICO_3.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', });
lyr_INTEGRA2_4.set('fieldAliases', {'BACIA': 'BACIA', 'MUNICÍPIO': 'MUNICÍPIO', 'UN': 'UN', 'SISTEMA': 'SISTEMA', 'TIPO': 'TIPO', 'SITUAÇÃO': 'SITUAÇÃO', 'PACOTE_ATU': 'PACOTE_ATU', 'NOME_ATUAL': 'NOME_ATUAL', 'ID_EMPREEN': 'ID_EMPREEN', 'Shape_Leng': 'Shape_Leng', 'PROGRAMA': 'PROGRAMA', });
lyr_OBRAS_EMN2_5.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'NUM_BP': 'NUM_BP', 'EXTENSÃO': 'EXTENSÃO', });
lyr_ETES_6.set('fieldAliases', {'ETE': 'ETE', 'Q': 'Q', 'LOCAL': 'LOCAL', });
lyr_EEE_7.set('fieldAliases', {'EEE': 'EEE', 'Q': 'Q', 'STATUS': 'STATUS', 'LOCAL': 'LOCAL', 'ENDEREÇO': 'ENDEREÇO', 'MUNICIPIO': 'MUNICIPIO', 'OPERAÇÃO': 'OPERAÇÃO', 'CONTRATO': 'CONTRATO', });
lyr_SinistroEMN2_8.set('fieldAliases', {'Contrato': 'Contrato', 'Ficha': 'Ficha', 'Nome': 'Nome', 'Endereço': 'Endereço', 'Frente': 'Frente', 'Sinistro': 'Sinistro', 'Critério': 'Critério', });
lyr_PONTOSDELANAMENTO_9.set('fieldAliases', {'Nome_Lanca': 'Nome_Lanca', 'Subdivisao': 'Subdivisao', 'Unidade_Ne': 'Unidade_Ne', 'Municipio': 'Municipio', 'Bacia': 'Bacia', 'Pacote': 'Pacote', 'Contrato': 'Contrato', 'Status': 'Status', });
lyr_FRENTES_10.set('fieldAliases', {'fid': 'fid', 'ID': 'ID', 'COORD': 'COORD', 'NUM_CONTRA': 'NUM_CONTRA', 'AJUSTE STA': 'AJUSTE STA', 'ETAPA': 'ETAPA', 'GAS': 'GAS', 'ELETRICIDA': 'ELETRICIDA', 'TELECON': 'TELECON', 'DRENAGEM': 'DRENAGEM', 'VCA': 'VCA', 'HDD': 'HDD', 'OUTROS_MND': 'OUTROS_MND', '<1,25M': '<1,25M', 'ATÉ 4,00': 'ATÉ 4,00', '> 4,00 M': '> 4,00 M', 'SOMA': 'SOMA', 'RISCO': 'RISCO', 'ENDERECO_C': 'ENDERECO_C', 'DT_INICIO': 'DT_INICIO', 'Latitude': 'Latitude', 'Longitude': 'Longitude', 'DT TERMINO': 'DT TERMINO', 'PARALISADO': 'PARALISADO', 'JUSTIFICATIVA': 'JUSTIFICATIVA', 'layer': 'layer', 'path': 'path', });
lyr_COMGS_1.set('fieldImages', {'FME_GEOMET': 'TextEdit', 'ID': 'TextEdit', 'U_DATA': 'DateTime', });
lyr_VIRADADEMANCHA_2.set('fieldImages', {'NOME': 'TextEdit', 'DATA_INSER': 'DateTime', 'COORDENACA': 'TextEdit', 'COR_MANCHA': 'TextEdit', 'ECON_FTU': 'TextEdit', 'ECON_CONT': 'TextEdit', });
lyr_PROJETOBSICO_3.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', });
lyr_INTEGRA2_4.set('fieldImages', {'BACIA': 'TextEdit', 'MUNICÍPIO': 'TextEdit', 'UN': 'TextEdit', 'SISTEMA': 'TextEdit', 'TIPO': 'TextEdit', 'SITUAÇÃO': 'TextEdit', 'PACOTE_ATU': 'TextEdit', 'NOME_ATUAL': 'TextEdit', 'ID_EMPREEN': 'TextEdit', 'Shape_Leng': 'TextEdit', 'PROGRAMA': 'TextEdit', });
lyr_OBRAS_EMN2_5.set('fieldImages', {'NUM_CONTRA': '', 'OBJ_REDUZI': '', 'DIAMETR_MM': '', 'METODO': '', 'TIPO': '', 'MUNICIPIO': '', 'BAIRRO': '', 'LOGRADOURO': '', 'FRENTE': '', 'DETA_METOD': '', 'DT_INI_OBR': '', 'DT_TER_OBR': '', 'DT_PAV_PRO': '', 'DT_PAV_DEF': '', 'STATUS_C': '', 'NUM_BP': '', 'EXTENSÃO': '', });
lyr_ETES_6.set('fieldImages', {'ETE': 'TextEdit', 'Q': 'TextEdit', 'LOCAL': 'TextEdit', });
lyr_EEE_7.set('fieldImages', {'EEE': 'TextEdit', 'Q': 'TextEdit', 'STATUS': 'TextEdit', 'LOCAL': 'TextEdit', 'ENDEREÇO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'OPERAÇÃO': 'TextEdit', 'CONTRATO': '', });
lyr_SinistroEMN2_8.set('fieldImages', {'Contrato': 'TextEdit', 'Ficha': 'TextEdit', 'Nome': 'TextEdit', 'Endereço': 'TextEdit', 'Frente': 'TextEdit', 'Sinistro': 'TextEdit', 'Critério': 'TextEdit', });
lyr_PONTOSDELANAMENTO_9.set('fieldImages', {'Nome_Lanca': '', 'Subdivisao': '', 'Unidade_Ne': '', 'Municipio': '', 'Bacia': '', 'Pacote': '', 'Contrato': '', 'Status': '', });
lyr_FRENTES_10.set('fieldImages', {'fid': 'TextEdit', 'ID': 'TextEdit', 'COORD': 'TextEdit', 'NUM_CONTRA': 'TextEdit', 'AJUSTE STA': 'TextEdit', 'ETAPA': 'TextEdit', 'GAS': 'Range', 'ELETRICIDA': 'Range', 'TELECON': 'Range', 'DRENAGEM': 'Range', 'VCA': 'Range', 'HDD': 'Range', 'OUTROS_MND': 'Range', '<1,25M': 'Range', 'ATÉ 4,00': 'Range', '> 4,00 M': 'Range', 'SOMA': 'Range', 'RISCO': 'TextEdit', 'ENDERECO_C': 'TextEdit', 'DT_INICIO': 'TextEdit', 'Latitude': 'TextEdit', 'Longitude': 'TextEdit', 'DT TERMINO': 'TextEdit', 'PARALISADO': 'TextEdit', 'JUSTIFICATIVA': 'TextEdit', 'layer': 'TextEdit', 'path': 'TextEdit', });
lyr_COMGS_1.set('fieldLabels', {'FME_GEOMET': 'hidden field', 'ID': 'hidden field', 'U_DATA': 'hidden field', });
lyr_VIRADADEMANCHA_2.set('fieldLabels', {'NOME': 'inline label - always visible', 'DATA_INSER': 'inline label - always visible', 'COORDENACA': 'inline label - always visible', 'COR_MANCHA': 'inline label - always visible', 'ECON_FTU': 'inline label - always visible', 'ECON_CONT': 'inline label - always visible', });
lyr_PROJETOBSICO_3.set('fieldLabels', {'NUM_CONTRA': 'header label - always visible', 'OBJ_REDUZI': 'inline label - always visible', 'DIAMETR_MM': 'inline label - always visible', 'PROF_MED_M': 'inline label - always visible', 'METODO': 'inline label - always visible', 'TIPO': 'inline label - always visible', 'MUNICIPIO': 'inline label - always visible', 'BAIRRO': 'inline label - always visible', 'LOGRADOURO': 'inline label - always visible', 'FRENTE': 'inline label - always visible', 'DETA_METOD': 'inline label - always visible', });
lyr_INTEGRA2_4.set('fieldLabels', {'BACIA': 'no label', 'MUNICÍPIO': 'no label', 'UN': 'no label', 'SISTEMA': 'no label', 'TIPO': 'no label', 'SITUAÇÃO': 'no label', 'PACOTE_ATU': 'no label', 'NOME_ATUAL': 'no label', 'ID_EMPREEN': 'no label', 'Shape_Leng': 'no label', 'PROGRAMA': 'no label', });
lyr_OBRAS_EMN2_5.set('fieldLabels', {'NUM_CONTRA': 'header label - always visible', 'OBJ_REDUZI': 'inline label - always visible', 'DIAMETR_MM': 'inline label - always visible', 'METODO': 'inline label - always visible', 'TIPO': 'inline label - always visible', 'MUNICIPIO': 'inline label - always visible', 'BAIRRO': 'inline label - always visible', 'LOGRADOURO': 'inline label - always visible', 'FRENTE': 'inline label - always visible', 'DETA_METOD': 'inline label - always visible', 'DT_INI_OBR': 'inline label - always visible', 'DT_TER_OBR': 'inline label - always visible', 'DT_PAV_PRO': 'inline label - always visible', 'DT_PAV_DEF': 'inline label - always visible', 'STATUS_C': 'inline label - always visible', 'NUM_BP': 'inline label - always visible', 'EXTENSÃO': 'no label', });
lyr_ETES_6.set('fieldLabels', {'ETE': 'header label - always visible', 'Q': 'inline label - always visible', 'LOCAL': 'inline label - always visible', });
lyr_EEE_7.set('fieldLabels', {'EEE': 'header label - always visible', 'Q': 'inline label - always visible', 'STATUS': 'inline label - always visible', 'LOCAL': 'inline label - always visible', 'ENDEREÇO': 'inline label - always visible', 'MUNICIPIO': 'inline label - always visible', 'OPERAÇÃO': 'inline label - always visible', 'CONTRATO': 'no label', });
lyr_SinistroEMN2_8.set('fieldLabels', {'Contrato': 'header label - always visible', 'Ficha': 'inline label - always visible', 'Nome': 'inline label - always visible', 'Endereço': 'inline label - always visible', 'Frente': 'inline label - always visible', 'Sinistro': 'inline label - always visible', 'Critério': 'inline label - always visible', });
lyr_PONTOSDELANAMENTO_9.set('fieldLabels', {'Nome_Lanca': 'header label - always visible', 'Subdivisao': 'inline label - always visible', 'Unidade_Ne': 'inline label - always visible', 'Municipio': 'inline label - always visible', 'Bacia': 'inline label - always visible', 'Pacote': 'inline label - always visible', 'Contrato': 'inline label - always visible', 'Status': 'header label - always visible', });
lyr_FRENTES_10.set('fieldLabels', {'fid': 'hidden field', 'ID': 'hidden field', 'COORD': 'hidden field', 'NUM_CONTRA': 'header label - always visible', 'AJUSTE STA': 'inline label - always visible', 'ETAPA': 'inline label - always visible', 'GAS': 'inline label - visible with data', 'ELETRICIDA': 'hidden field', 'TELECON': 'hidden field', 'DRENAGEM': 'hidden field', 'VCA': 'hidden field', 'HDD': 'hidden field', 'OUTROS_MND': 'hidden field', '<1,25M': 'hidden field', 'ATÉ 4,00': 'hidden field', '> 4,00 M': 'hidden field', 'SOMA': 'hidden field', 'RISCO': 'inline label - always visible', 'ENDERECO_C': 'hidden field', 'DT_INICIO': 'inline label - always visible', 'Latitude': 'no label', 'Longitude': 'no label', 'DT TERMINO': 'inline label - always visible', 'PARALISADO': 'inline label - visible with data', 'JUSTIFICATIVA': 'inline label - visible with data', 'layer': 'hidden field', 'path': 'hidden field', });
lyr_FRENTES_10.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});
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
var format_INTEGRA2_3 = new ol.format.GeoJSON();
var features_INTEGRA2_3 = format_INTEGRA2_3.readFeatures(json_INTEGRA2_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_INTEGRA2_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_INTEGRA2_3.addFeatures(features_INTEGRA2_3);
var lyr_INTEGRA2_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_INTEGRA2_3, 
                style: style_INTEGRA2_3,
                popuplayertitle: 'INTEGRA 2',
                interactive: true,
    title: 'INTEGRA 2<br />\
    <img src="styles/legend/INTEGRA2_3_0.png" /> OBRA EM CONTRATAÇÃO<br />\
    <img src="styles/legend/INTEGRA2_3_1.png" /> COM PROJETO BASICO<br />\
    <img src="styles/legend/INTEGRA2_3_2.png" /> SEM PROJETO BASICO<br />' });
var format_EML2_4 = new ol.format.GeoJSON();
var features_EML2_4 = format_EML2_4.readFeatures(json_EML2_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EML2_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EML2_4.addFeatures(features_EML2_4);
var lyr_EML2_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EML2_4, 
                style: style_EML2_4,
                popuplayertitle: 'EML2',
                interactive: true,
                title: '<img src="styles/legend/EML2_4.png" /> EML2'
            });
var format_EML1_5 = new ol.format.GeoJSON();
var features_EML1_5 = format_EML1_5.readFeatures(json_EML1_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EML1_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EML1_5.addFeatures(features_EML1_5);
var lyr_EML1_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EML1_5, 
                style: style_EML1_5,
                popuplayertitle: 'EML1',
                interactive: true,
                title: '<img src="styles/legend/EML1_5.png" /> EML1'
            });
var format_EMO2_6 = new ol.format.GeoJSON();
var features_EMO2_6 = format_EMO2_6.readFeatures(json_EMO2_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EMO2_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EMO2_6.addFeatures(features_EMO2_6);
var lyr_EMO2_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EMO2_6, 
                style: style_EMO2_6,
                popuplayertitle: 'EMO2',
                interactive: true,
                title: '<img src="styles/legend/EMO2_6.png" /> EMO2'
            });
var format_EMO1_7 = new ol.format.GeoJSON();
var features_EMO1_7 = format_EMO1_7.readFeatures(json_EMO1_7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EMO1_7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EMO1_7.addFeatures(features_EMO1_7);
var lyr_EMO1_7 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EMO1_7, 
                style: style_EMO1_7,
                popuplayertitle: 'EMO1',
                interactive: true,
                title: '<img src="styles/legend/EMO1_7.png" /> EMO1'
            });
var format_EMS_8 = new ol.format.GeoJSON();
var features_EMS_8 = format_EMS_8.readFeatures(json_EMS_8, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EMS_8 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EMS_8.addFeatures(features_EMS_8);
var lyr_EMS_8 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EMS_8, 
                style: style_EMS_8,
                popuplayertitle: 'EMS',
                interactive: true,
                title: '<img src="styles/legend/EMS_8.png" /> EMS'
            });
var format_ExNorte_9 = new ol.format.GeoJSON();
var features_ExNorte_9 = format_ExNorte_9.readFeatures(json_ExNorte_9, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_ExNorte_9 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_ExNorte_9.addFeatures(features_ExNorte_9);
var lyr_ExNorte_9 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_ExNorte_9, 
                style: style_ExNorte_9,
                popuplayertitle: 'ExNorte',
                interactive: true,
                title: '<img src="styles/legend/ExNorte_9.png" /> ExNorte'
            });
var format_EMN1_10 = new ol.format.GeoJSON();
var features_EMN1_10 = format_EMN1_10.readFeatures(json_EMN1_10, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EMN1_10 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EMN1_10.addFeatures(features_EMN1_10);
var lyr_EMN1_10 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EMN1_10, 
                style: style_EMN1_10,
                popuplayertitle: 'EMN1',
                interactive: true,
                title: '<img src="styles/legend/EMN1_10.png" /> EMN1'
            });
var format_OBRAS_EMN2_11 = new ol.format.GeoJSON();
var features_OBRAS_EMN2_11 = format_OBRAS_EMN2_11.readFeatures(json_OBRAS_EMN2_11, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_OBRAS_EMN2_11 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_OBRAS_EMN2_11.addFeatures(features_OBRAS_EMN2_11);
var lyr_OBRAS_EMN2_11 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_OBRAS_EMN2_11, 
                style: style_OBRAS_EMN2_11,
                popuplayertitle: 'OBRAS_EMN2',
                interactive: true,
    title: 'OBRAS_EMN2<br />\
    <img src="styles/legend/OBRAS_EMN2_11_0.png" /> OBRA A INICIAR<br />\
    <img src="styles/legend/OBRAS_EMN2_11_1.png" /> OBRA EM ANDAMENTO<br />\
    <img src="styles/legend/OBRAS_EMN2_11_2.png" /> OBRA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_11_3.png" /> PAVIMENTAÇÃO PROVISÓRIA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_11_4.png" /> PAVIMENTAÇÃO DEFINITIVA CONCLUÍDA<br />\
    <img src="styles/legend/OBRAS_EMN2_11_5.png" /> IMOBILIZADO<br />\
    <img src="styles/legend/OBRAS_EMN2_11_6.png" /> SUPRIMIDO<br />\
    <img src="styles/legend/OBRAS_EMN2_11_7.png" /> EXISTENTE<br />' });
var format_FRENTESOUTRASCOORDENAES_12 = new ol.format.GeoJSON();
var features_FRENTESOUTRASCOORDENAES_12 = format_FRENTESOUTRASCOORDENAES_12.readFeatures(json_FRENTESOUTRASCOORDENAES_12, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_FRENTESOUTRASCOORDENAES_12 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_FRENTESOUTRASCOORDENAES_12.addFeatures(features_FRENTESOUTRASCOORDENAES_12);
var lyr_FRENTESOUTRASCOORDENAES_12 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_FRENTESOUTRASCOORDENAES_12, 
                style: style_FRENTESOUTRASCOORDENAES_12,
                popuplayertitle: 'FRENTES-OUTRAS COORDENAÇÕES',
                interactive: true,
    title: 'FRENTES-OUTRAS COORDENAÇÕES<br />\
    <img src="styles/legend/FRENTESOUTRASCOORDENAES_12_0.png" /> ADEQUAÇÃO ARSESP<br />\
    <img src="styles/legend/FRENTESOUTRASCOORDENAES_12_1.png" /> CONCLUÍDO<br />\
    <img src="styles/legend/FRENTESOUTRASCOORDENAES_12_2.png" /> EM ANDAMENTO<br />\
    <img src="styles/legend/FRENTESOUTRASCOORDENAES_12_3.png" /> PARALISADO SEM GÁS<br />' });
var format_ETES_13 = new ol.format.GeoJSON();
var features_ETES_13 = format_ETES_13.readFeatures(json_ETES_13, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_ETES_13 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_ETES_13.addFeatures(features_ETES_13);
var lyr_ETES_13 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_ETES_13, 
                style: style_ETES_13,
                popuplayertitle: 'ETE\'S',
                interactive: true,
                title: '<img src="styles/legend/ETES_13.png" /> ETE\'S'
            });
var format_EEE_14 = new ol.format.GeoJSON();
var features_EEE_14 = format_EEE_14.readFeatures(json_EEE_14, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_EEE_14 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_EEE_14.addFeatures(features_EEE_14);
var lyr_EEE_14 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_EEE_14, 
                style: style_EEE_14,
                popuplayertitle: 'EEE',
                interactive: true,
    title: 'EEE<br />\
    <img src="styles/legend/EEE_14_0.png" /> A INICIAR<br />\
    <img src="styles/legend/EEE_14_1.png" /> EM CONSTRUÇÃO<br />\
    <img src="styles/legend/EEE_14_2.png" /> SUPRIMIDO<br />' });
var format_SinistroEMN2_15 = new ol.format.GeoJSON();
var features_SinistroEMN2_15 = format_SinistroEMN2_15.readFeatures(json_SinistroEMN2_15, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_SinistroEMN2_15 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_SinistroEMN2_15.addFeatures(features_SinistroEMN2_15);
var lyr_SinistroEMN2_15 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_SinistroEMN2_15, 
                style: style_SinistroEMN2_15,
                popuplayertitle: 'Sinistro-EMN2',
                interactive: true,
                title: '<img src="styles/legend/SinistroEMN2_15.png" /> Sinistro-EMN2'
            });
var format_PONTOSDELANAMENTO_16 = new ol.format.GeoJSON();
var features_PONTOSDELANAMENTO_16 = format_PONTOSDELANAMENTO_16.readFeatures(json_PONTOSDELANAMENTO_16, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PONTOSDELANAMENTO_16 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PONTOSDELANAMENTO_16.addFeatures(features_PONTOSDELANAMENTO_16);
var lyr_PONTOSDELANAMENTO_16 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PONTOSDELANAMENTO_16, 
                style: style_PONTOSDELANAMENTO_16,
                popuplayertitle: 'PONTOS DE LANÇAMENTO',
                interactive: true,
    title: 'PONTOS DE LANÇAMENTO<br />\
    <img src="styles/legend/PONTOSDELANAMENTO_16_0.png" /> ATIVO<br />\
    <img src="styles/legend/PONTOSDELANAMENTO_16_1.png" /> ELIMINADO<br />' });
var format_FRENTESEMN2_17 = new ol.format.GeoJSON();
var features_FRENTESEMN2_17 = format_FRENTESEMN2_17.readFeatures(json_FRENTESEMN2_17, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_FRENTESEMN2_17 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_FRENTESEMN2_17.addFeatures(features_FRENTESEMN2_17);
var lyr_FRENTESEMN2_17 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_FRENTESEMN2_17, 
                style: style_FRENTESEMN2_17,
                popuplayertitle: 'FRENTES EMN2',
                interactive: true,
    title: 'FRENTES EMN2<br />\
    <img src="styles/legend/FRENTESEMN2_17_0.png" /> ADEQUAÇÃO ARSESP<br />\
    <img src="styles/legend/FRENTESEMN2_17_1.png" /> CONCLUÍDO<br />\
    <img src="styles/legend/FRENTESEMN2_17_2.png" /> EM ANDAMENTO<br />\
    <img src="styles/legend/FRENTESEMN2_17_3.png" /> PARALISADO SEM GÁS<br />' });

lyr_GoogleSatelliteHybrid_0.setVisible(true);lyr_COMGS_1.setVisible(true);lyr_VIRADADEMANCHA_2.setVisible(true);lyr_INTEGRA2_3.setVisible(true);lyr_EML2_4.setVisible(false);lyr_EML1_5.setVisible(false);lyr_EMO2_6.setVisible(false);lyr_EMO1_7.setVisible(false);lyr_EMS_8.setVisible(false);lyr_ExNorte_9.setVisible(false);lyr_EMN1_10.setVisible(false);lyr_OBRAS_EMN2_11.setVisible(true);lyr_FRENTESOUTRASCOORDENAES_12.setVisible(false);lyr_ETES_13.setVisible(true);lyr_EEE_14.setVisible(true);lyr_SinistroEMN2_15.setVisible(true);lyr_PONTOSDELANAMENTO_16.setVisible(true);lyr_FRENTESEMN2_17.setVisible(true);
var layersList = [lyr_GoogleSatelliteHybrid_0,lyr_COMGS_1,lyr_VIRADADEMANCHA_2,lyr_INTEGRA2_3,lyr_EML2_4,lyr_EML1_5,lyr_EMO2_6,lyr_EMO1_7,lyr_EMS_8,lyr_ExNorte_9,lyr_EMN1_10,lyr_OBRAS_EMN2_11,lyr_FRENTESOUTRASCOORDENAES_12,lyr_ETES_13,lyr_EEE_14,lyr_SinistroEMN2_15,lyr_PONTOSDELANAMENTO_16,lyr_FRENTESEMN2_17];
lyr_COMGS_1.set('fieldAliases', {'FME_GEOMET': 'FME_GEOMET', 'ID': 'ID', 'U_DATA': 'U_DATA', });
lyr_VIRADADEMANCHA_2.set('fieldAliases', {'NOME': 'NOME', 'DATA_INSER': 'DATA_INSER', 'COORDENACA': 'COORDENACA', 'COR_MANCHA': 'COR_MANCHA', 'ECON_FTU': 'ECON_FTU', 'ECON_CONT': 'ECON_CONT', });
lyr_INTEGRA2_3.set('fieldAliases', {'BACIA': 'BACIA', 'MUNICÍPIO': 'MUNICÍPIO', 'UN': 'UN', 'SISTEMA': 'SISTEMA', 'TIPO': 'TIPO', 'SITUAÇÃO': 'SITUAÇÃO', 'PACOTE_ATU': 'PACOTE_ATU', 'NOME_ATUAL': 'NOME_ATUAL', 'ID_EMPREEN': 'ID_EMPREEN', 'Shape_Leng': 'Shape_Leng', 'PROGRAMA': 'PROGRAMA', });
lyr_EML2_4.set('fieldAliases', {'fid': 'fid', 'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', });
lyr_EML1_5.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'PAVIMENT': 'PAVIMENT', });
lyr_EMO2_6.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', 'fid': 'fid', 'OBS': 'OBS', 'OBS_2_2': 'OBS_2_2', 'layer': 'layer', 'path': 'path', });
lyr_EMO1_7.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', 'layer': 'layer', 'path': 'path', 'temp': 'temp', 'PAVIMENT': 'PAVIMENT', 'id': 'id', 'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', });
lyr_EMS_8.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', });
lyr_ExNorte_9.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'PAVIMENT': 'PAVIMENT', 'NOVO': 'NOVO', });
lyr_EMN1_10.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', 'layer': 'layer', 'path': 'path', 'temp': 'temp', 'PAVIMENT': 'PAVIMENT', 'fid': 'fid', });
lyr_OBRAS_EMN2_11.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'NUM_BP': 'NUM_BP', 'EXTENSÃO': 'EXTENSÃO', });
lyr_FRENTESOUTRASCOORDENAES_12.set('fieldAliases', {'ID': 'ID', 'COORD': 'COORD', 'NUM_CONTRA': 'NUM_CONTRA', 'ENG RESP': 'ENG RESP', 'AJUSTE STA': 'AJUSTE STA', 'ETAPA': 'ETAPA', 'GAS': 'GAS', 'ELETRICIDA': 'ELETRICIDA', 'TELECON': 'TELECON', 'DRENAGEM': 'DRENAGEM', 'VCA': 'VCA', 'HDD': 'HDD', 'OUTROS_MND': 'OUTROS_MND', '< 1,25M': '< 1,25M', 'ATÉ 4,00': 'ATÉ 4,00', '> 4,00 M': '> 4,00 M', 'SOMA': 'SOMA', 'RISCO': 'RISCO', 'ENDERECO_C': 'ENDERECO_C', 'DT_INICIO': 'DT_INICIO', 'DT_TERM': 'DT_TERM', 'JUSTIFICAT': 'JUSTIFICAT', 'LATITUDE': 'LATITUDE', 'LONGITUDE': 'LONGITUDE', 'fid': 'fid', '<1,25M': '<1,25M', 'DT TERMINO': 'DT TERMINO', 'PARALISADO': 'PARALISADO', 'JUSTIFICATIVA': 'JUSTIFICATIVA', 'RESETAR': 'RESETAR', 'layer': 'layer', 'path': 'path', 'FRENTE': 'FRENTE', 'NOME OBRA': 'NOME OBRA', });
lyr_ETES_13.set('fieldAliases', {'ETE': 'ETE', 'Q': 'Q', 'LOCAL': 'LOCAL', });
lyr_EEE_14.set('fieldAliases', {'EEE': 'EEE', 'Q': 'Q', 'STATUS': 'STATUS', 'LOCAL': 'LOCAL', 'ENDEREÇO': 'ENDEREÇO', 'MUNICIPIO': 'MUNICIPIO', 'OPERAÇÃO': 'OPERAÇÃO', 'CONTRATO': 'CONTRATO', });
lyr_SinistroEMN2_15.set('fieldAliases', {'Contrato': 'Contrato', 'Ficha': 'Ficha', 'Nome': 'Nome', 'Endereço': 'Endereço', 'Frente': 'Frente', 'Sinistro': 'Sinistro', 'Critério': 'Critério', });
lyr_PONTOSDELANAMENTO_16.set('fieldAliases', {'Nome_Lanca': 'Nome_Lanca', 'Subdivisao': 'Subdivisao', 'Unidade_Ne': 'Unidade_Ne', 'Municipio': 'Municipio', 'Bacia': 'Bacia', 'Pacote': 'Pacote', 'Contrato': 'Contrato', 'Status': 'Status', });
lyr_FRENTESEMN2_17.set('fieldAliases', {'fid': 'fid', 'ID': 'ID', 'COORD': 'COORD', 'NUM_CONTRA': 'NUM_CONTRA', 'FRENTE': 'FRENTE', 'MÉTODO': 'MÉTODO', 'DETAL_MÉT': 'DETAL_MÉT', 'ATIVIDADE': 'ATIVIDADE', 'AJUSTE STA': 'AJUSTE STA', 'ETAPA': 'ETAPA', 'PROFUNDIDA': 'PROFUNDIDA', 'GAS': 'GAS', 'ELETRICIDA': 'ELETRICIDA', 'TELECON': 'TELECON', 'DRENAGEM': 'DRENAGEM', 'SOMA': 'SOMA', 'RISCO': 'RISCO', 'DT_INICIO': 'DT_INICIO', 'DT TERMINO': 'DT TERMINO', 'ENGENHEIRO': 'ENGENHEIRO', 'FISCAL': 'FISCAL', 'ENCARREGAD': 'ENCARREGAD', 'EQUIPE': 'EQUIPE', 'APOIO': 'APOIO', 'RETRO': 'RETRO', 'ENDERECO_C': 'ENDERECO_C', 'VCA': 'VCA', 'HDD': 'HDD', 'OUTROS_MND': 'OUTROS_MND', '<1,25': '<1,25', 'ATÉ 4,00': 'ATÉ 4,00', '>4,00': '>4,00', 'Latitude': 'Latitude', 'Longitude': 'Longitude', 'JUSTIFICAT': 'JUSTIFICAT', 'JUSTIFIC_1': 'JUSTIFIC_1', 'JUSTIFIC_2': 'JUSTIFIC_2', });
lyr_COMGS_1.set('fieldImages', {'FME_GEOMET': 'TextEdit', 'ID': 'TextEdit', 'U_DATA': 'DateTime', });
lyr_VIRADADEMANCHA_2.set('fieldImages', {'NOME': 'TextEdit', 'DATA_INSER': 'DateTime', 'COORDENACA': 'TextEdit', 'COR_MANCHA': 'TextEdit', 'ECON_FTU': 'TextEdit', 'ECON_CONT': 'TextEdit', });
lyr_INTEGRA2_3.set('fieldImages', {'BACIA': 'TextEdit', 'MUNICÍPIO': 'TextEdit', 'UN': 'TextEdit', 'SISTEMA': 'TextEdit', 'TIPO': 'TextEdit', 'SITUAÇÃO': 'TextEdit', 'PACOTE_ATU': 'TextEdit', 'NOME_ATUAL': 'TextEdit', 'ID_EMPREEN': 'TextEdit', 'Shape_Leng': 'TextEdit', 'PROGRAMA': 'TextEdit', });
lyr_EML2_4.set('fieldImages', {'fid': 'TextEdit', 'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', });
lyr_EML1_5.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'PAVIMENT': 'TextEdit', });
lyr_EMO2_6.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', 'fid': 'TextEdit', 'OBS': 'TextEdit', 'OBS_2_2': 'TextEdit', 'layer': 'TextEdit', 'path': 'TextEdit', });
lyr_EMO1_7.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', 'layer': 'TextEdit', 'path': 'TextEdit', 'temp': 'TextEdit', 'PAVIMENT': 'TextEdit', 'id': 'TextEdit', 'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'TextEdit', 'begin': 'TextEdit', 'end': 'TextEdit', 'altitudeMo': 'TextEdit', 'tessellate': 'TextEdit', 'extrude': 'TextEdit', 'visibility': 'TextEdit', 'drawOrder': 'TextEdit', 'icon': 'TextEdit', });
lyr_EMS_8.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', });
lyr_ExNorte_9.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'PAVIMENT': 'TextEdit', 'NOVO': 'TextEdit', });
lyr_EMN1_10.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'TextEdit', 'DT_TER_OBR': 'TextEdit', 'DT_PAV_PRO': 'TextEdit', 'DT_PAV_DEF': 'TextEdit', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', 'layer': 'TextEdit', 'path': 'TextEdit', 'temp': 'TextEdit', 'PAVIMENT': 'TextEdit', 'fid': 'TextEdit', });
lyr_OBRAS_EMN2_11.set('fieldImages', {'NUM_CONTRA': '', 'OBJ_REDUZI': '', 'DIAMETR_MM': '', 'METODO': '', 'TIPO': '', 'MUNICIPIO': '', 'BAIRRO': '', 'LOGRADOURO': '', 'FRENTE': '', 'DETA_METOD': '', 'DT_INI_OBR': '', 'DT_TER_OBR': '', 'DT_PAV_PRO': '', 'DT_PAV_DEF': '', 'STATUS_C': '', 'NUM_BP': '', 'EXTENSÃO': '', });
lyr_FRENTESOUTRASCOORDENAES_12.set('fieldImages', {'ID': 'TextEdit', 'COORD': 'TextEdit', 'NUM_CONTRA': 'TextEdit', 'ENG RESP': '', 'AJUSTE STA': 'TextEdit', 'ETAPA': 'TextEdit', 'GAS': 'TextEdit', 'ELETRICIDA': 'TextEdit', 'TELECON': 'TextEdit', 'DRENAGEM': 'TextEdit', 'VCA': 'TextEdit', 'HDD': 'TextEdit', 'OUTROS_MND': 'TextEdit', '< 1,25M': '', 'ATÉ 4,00': 'TextEdit', '> 4,00 M': '', 'SOMA': 'TextEdit', 'RISCO': 'TextEdit', 'ENDERECO_C': 'TextEdit', 'DT_INICIO': 'TextEdit', 'DT_TERM': '', 'JUSTIFICAT': 'TextEdit', 'LATITUDE': '', 'LONGITUDE': '', 'fid': 'TextEdit', '<1,25M': '', 'DT TERMINO': 'TextEdit', 'PARALISADO': '', 'JUSTIFICATIVA': '', 'RESETAR': '', 'layer': '', 'path': '', 'FRENTE': 'TextEdit', 'NOME OBRA': '', });
lyr_ETES_13.set('fieldImages', {'ETE': 'TextEdit', 'Q': 'TextEdit', 'LOCAL': 'TextEdit', });
lyr_EEE_14.set('fieldImages', {'EEE': 'TextEdit', 'Q': 'TextEdit', 'STATUS': 'TextEdit', 'LOCAL': 'TextEdit', 'ENDEREÇO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'OPERAÇÃO': 'TextEdit', 'CONTRATO': '', });
lyr_SinistroEMN2_15.set('fieldImages', {'Contrato': 'TextEdit', 'Ficha': 'TextEdit', 'Nome': 'TextEdit', 'Endereço': 'TextEdit', 'Frente': 'TextEdit', 'Sinistro': 'TextEdit', 'Critério': 'TextEdit', });
lyr_PONTOSDELANAMENTO_16.set('fieldImages', {'Nome_Lanca': '', 'Subdivisao': '', 'Unidade_Ne': '', 'Municipio': '', 'Bacia': '', 'Pacote': '', 'Contrato': '', 'Status': '', });
lyr_FRENTESEMN2_17.set('fieldImages', {'fid': 'TextEdit', 'ID': 'TextEdit', 'COORD': 'TextEdit', 'NUM_CONTRA': 'TextEdit', 'FRENTE': 'TextEdit', 'MÉTODO': 'TextEdit', 'DETAL_MÉT': 'TextEdit', 'ATIVIDADE': 'TextEdit', 'AJUSTE STA': 'TextEdit', 'ETAPA': 'TextEdit', 'PROFUNDIDA': 'TextEdit', 'GAS': 'TextEdit', 'ELETRICIDA': 'TextEdit', 'TELECON': 'TextEdit', 'DRENAGEM': 'TextEdit', 'SOMA': 'TextEdit', 'RISCO': 'TextEdit', 'DT_INICIO': 'TextEdit', 'DT TERMINO': 'TextEdit', 'ENGENHEIRO': 'TextEdit', 'FISCAL': 'TextEdit', 'ENCARREGAD': 'TextEdit', 'EQUIPE': 'TextEdit', 'APOIO': 'TextEdit', 'RETRO': 'TextEdit', 'ENDERECO_C': 'TextEdit', 'VCA': 'TextEdit', 'HDD': 'TextEdit', 'OUTROS_MND': 'TextEdit', '<1,25': 'TextEdit', 'ATÉ 4,00': 'TextEdit', '>4,00': 'TextEdit', 'Latitude': 'TextEdit', 'Longitude': 'TextEdit', 'JUSTIFICAT': 'TextEdit', 'JUSTIFIC_1': 'TextEdit', 'JUSTIFIC_2': 'TextEdit', });
lyr_COMGS_1.set('fieldLabels', {'FME_GEOMET': 'hidden field', 'ID': 'hidden field', 'U_DATA': 'hidden field', });
lyr_VIRADADEMANCHA_2.set('fieldLabels', {'NOME': 'inline label - always visible', 'DATA_INSER': 'inline label - always visible', 'COORDENACA': 'inline label - always visible', 'COR_MANCHA': 'inline label - always visible', 'ECON_FTU': 'inline label - always visible', 'ECON_CONT': 'inline label - always visible', });
lyr_INTEGRA2_3.set('fieldLabels', {'BACIA': 'inline label - always visible', 'MUNICÍPIO': 'inline label - always visible', 'UN': 'inline label - always visible', 'SISTEMA': 'inline label - always visible', 'TIPO': 'inline label - always visible', 'SITUAÇÃO': 'inline label - always visible', 'PACOTE_ATU': 'inline label - always visible', 'NOME_ATUAL': 'inline label - always visible', 'ID_EMPREEN': 'inline label - always visible', 'Shape_Leng': 'inline label - always visible', 'PROGRAMA': 'inline label - always visible', });
lyr_EML2_4.set('fieldLabels', {'fid': 'no label', 'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', });
lyr_EML1_5.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'PAVIMENT': 'no label', });
lyr_EMO2_6.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', 'fid': 'no label', 'OBS': 'no label', 'OBS_2_2': 'no label', 'layer': 'no label', 'path': 'no label', });
lyr_EMO1_7.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', 'layer': 'no label', 'path': 'no label', 'temp': 'no label', 'PAVIMENT': 'no label', 'id': 'no label', 'Name': 'no label', 'descriptio': 'no label', 'timestamp': 'no label', 'begin': 'no label', 'end': 'no label', 'altitudeMo': 'no label', 'tessellate': 'no label', 'extrude': 'no label', 'visibility': 'no label', 'drawOrder': 'no label', 'icon': 'no label', });
lyr_EMS_8.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', });
lyr_ExNorte_9.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'PAVIMENT': 'no label', 'NOVO': 'no label', });
lyr_EMN1_10.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', 'layer': 'no label', 'path': 'no label', 'temp': 'no label', 'PAVIMENT': 'no label', 'fid': 'no label', });
lyr_OBRAS_EMN2_11.set('fieldLabels', {'NUM_CONTRA': 'header label - always visible', 'OBJ_REDUZI': 'inline label - always visible', 'DIAMETR_MM': 'inline label - always visible', 'METODO': 'inline label - always visible', 'TIPO': 'inline label - always visible', 'MUNICIPIO': 'inline label - always visible', 'BAIRRO': 'inline label - always visible', 'LOGRADOURO': 'inline label - always visible', 'FRENTE': 'inline label - always visible', 'DETA_METOD': 'inline label - always visible', 'DT_INI_OBR': 'inline label - always visible', 'DT_TER_OBR': 'inline label - always visible', 'DT_PAV_PRO': 'inline label - always visible', 'DT_PAV_DEF': 'inline label - always visible', 'STATUS_C': 'inline label - always visible', 'NUM_BP': 'inline label - always visible', 'EXTENSÃO': 'no label', });
lyr_FRENTESOUTRASCOORDENAES_12.set('fieldLabels', {'ID': 'no label', 'COORD': 'header label - always visible', 'NUM_CONTRA': 'inline label - always visible', 'ENG RESP': 'no label', 'AJUSTE STA': 'inline label - always visible', 'ETAPA': 'hidden field', 'GAS': 'inline label - always visible', 'ELETRICIDA': 'inline label - always visible', 'TELECON': 'inline label - always visible', 'DRENAGEM': 'inline label - always visible', 'VCA': 'hidden field', 'HDD': 'hidden field', 'OUTROS_MND': 'hidden field', '< 1,25M': 'no label', 'ATÉ 4,00': 'hidden field', '> 4,00 M': 'no label', 'SOMA': 'inline label - always visible', 'RISCO': 'inline label - always visible', 'ENDERECO_C': 'inline label - always visible', 'DT_INICIO': 'inline label - always visible', 'DT_TERM': 'no label', 'JUSTIFICAT': 'inline label - always visible', 'LATITUDE': 'no label', 'LONGITUDE': 'no label', 'fid': 'hidden field', '<1,25M': 'no label', 'DT TERMINO': 'inline label - always visible', 'PARALISADO': 'no label', 'JUSTIFICATIVA': 'no label', 'RESETAR': 'no label', 'layer': 'no label', 'path': 'no label', 'FRENTE': 'inline label - always visible', 'NOME OBRA': 'no label', });
lyr_ETES_13.set('fieldLabels', {'ETE': 'header label - always visible', 'Q': 'inline label - always visible', 'LOCAL': 'inline label - always visible', });
lyr_EEE_14.set('fieldLabels', {'EEE': 'header label - always visible', 'Q': 'inline label - always visible', 'STATUS': 'inline label - always visible', 'LOCAL': 'inline label - always visible', 'ENDEREÇO': 'inline label - always visible', 'MUNICIPIO': 'inline label - always visible', 'OPERAÇÃO': 'inline label - always visible', 'CONTRATO': 'inline label - always visible', });
lyr_SinistroEMN2_15.set('fieldLabels', {'Contrato': 'header label - always visible', 'Ficha': 'inline label - always visible', 'Nome': 'inline label - always visible', 'Endereço': 'inline label - always visible', 'Frente': 'inline label - always visible', 'Sinistro': 'inline label - always visible', 'Critério': 'inline label - always visible', });
lyr_PONTOSDELANAMENTO_16.set('fieldLabels', {'Nome_Lanca': 'header label - always visible', 'Subdivisao': 'inline label - visible with data', 'Unidade_Ne': 'inline label - visible with data', 'Municipio': 'inline label - visible with data', 'Bacia': 'inline label - visible with data', 'Pacote': 'inline label - visible with data', 'Contrato': 'inline label - visible with data', 'Status': 'inline label - visible with data', });
lyr_FRENTESEMN2_17.set('fieldLabels', {'fid': 'hidden field', 'ID': 'no label', 'COORD': 'header label - always visible', 'NUM_CONTRA': 'inline label - always visible', 'FRENTE': 'inline label - always visible', 'MÉTODO': 'inline label - always visible', 'DETAL_MÉT': 'inline label - always visible', 'ATIVIDADE': 'inline label - always visible', 'AJUSTE STA': 'inline label - always visible', 'ETAPA': 'hidden field', 'PROFUNDIDA': 'inline label - always visible', 'GAS': 'inline label - always visible', 'ELETRICIDA': 'inline label - always visible', 'TELECON': 'inline label - always visible', 'DRENAGEM': 'inline label - always visible', 'SOMA': 'inline label - always visible', 'RISCO': 'inline label - always visible', 'DT_INICIO': 'inline label - always visible', 'DT TERMINO': 'inline label - always visible', 'ENGENHEIRO': 'inline label - always visible', 'FISCAL': 'inline label - always visible', 'ENCARREGAD': 'inline label - always visible', 'EQUIPE': 'inline label - always visible', 'APOIO': 'inline label - always visible', 'RETRO': 'inline label - always visible', 'ENDERECO_C': 'inline label - always visible', 'VCA': 'hidden field', 'HDD': 'hidden field', 'OUTROS_MND': 'hidden field', '<1,25': 'hidden field', 'ATÉ 4,00': 'hidden field', '>4,00': 'hidden field', 'Latitude': 'hidden field', 'Longitude': 'hidden field', 'JUSTIFICAT': 'inline label - always visible', 'JUSTIFIC_1': 'hidden field', 'JUSTIFIC_2': 'hidden field', });
lyr_FRENTESEMN2_17.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});
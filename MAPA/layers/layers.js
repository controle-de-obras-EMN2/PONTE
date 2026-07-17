var wms_layers = [];


        var lyr_GoogleSatelliteHybrid_0 = new ol.layer.Tile({
            'title': 'Google Satellite Hybrid',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });
var format_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1 = new ol.format.GeoJSON();
var features_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1 = format_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.readFeatures(json_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.addFeatures(features_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1);
var lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1, 
                style: style_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1,
                popuplayertitle: '00797-24_ME_DO_ALTO_BAQUIRIVU-GUAÇU_-_PCT_20',
                interactive: true,
                title: '<img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.png" /> 00797-24_ME_DO_ALTO_BAQUIRIVU-GUAÇU_-_PCT_20'
            });
var format_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2 = new ol.format.GeoJSON();
var features_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2 = format_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.readFeatures(json_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.addFeatures(features_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2);
var lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2, 
                style: style_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2,
                popuplayertitle: '00797-24_ME_DO_ALTO_BAQUIRIVU_GUAÇU-PCT_20',
                interactive: true,
    title: '00797-24_ME_DO_ALTO_BAQUIRIVU_GUAÇU-PCT_20<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_0.png" /> IMOBILIZADO<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_1.png" /> OBRA A INICIAR<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_2.png" /> OBRA CONCLUÍDA<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_3.png" /> OBRA EM ANDAMENTO<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_4.png" /> SUPRIMIDO<br />\
    <img src="styles/legend/0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2_5.png" /> <br />' });

lyr_GoogleSatelliteHybrid_0.setVisible(true);lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.setVisible(true);lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.setVisible(true);
var layersList = [lyr_GoogleSatelliteHybrid_0,lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1,lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2];
lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.set('fieldAliases', {'NUM_CONTRA': 'NUM_CONTRA', 'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'WBS_TEXT': 'WBS_TEXT', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.set('fieldAliases', {'OBJ_REDUZI': 'OBJ_REDUZI', 'DIAMETR_MM': 'DIAMETR_MM', 'PROF_MED_M': 'PROF_MED_M', 'METODO': 'METODO', 'TIPO': 'TIPO', 'MUNICIPIO': 'MUNICIPIO', 'BAIRRO': 'BAIRRO', 'LOGRADOURO': 'LOGRADOURO', 'FRENTE': 'FRENTE', 'DETA_METOD': 'DETA_METOD', 'DT_INI_OBR': 'DT_INI_OBR', 'DT_TER_OBR': 'DT_TER_OBR', 'DT_PAV_PRO': 'DT_PAV_PRO', 'DT_PAV_DEF': 'DT_PAV_DEF', 'STATUS_C': 'STATUS_C', 'STATUS': 'STATUS', 'OperadoPor': 'OperadoPor', 'Tipo_Colet': 'Tipo_Colet', 'Sub_Tipo': 'Sub_Tipo', 'Posicao_Re': 'Posicao_Re', 'Estado': 'Estado', 'Tipo_Sec': 'Tipo_Sec', 'Diametro': 'Diametro', 'Dim_Sec': 'Dim_Sec', 'Comp_Real': 'Comp_Real', 'Material': 'Material', 'Prof_GI_M': 'Prof_GI_M', 'Prof_GI_J': 'Prof_GI_J', 'Lig_M': 'Lig_M', 'Estad_Cons': 'Estad_Cons', 'Tipo_Escoa': 'Tipo_Escoa', 'Data_Inst': 'Data_Inst', 'Data_Oper': 'Data_Oper', 'Cadast?': 'Cadast?', 'Numero_BP': 'Numero_BP', 'Metod_Cons': 'Metod_Cons', 'Proprieta': 'Proprieta', 'Contrato_N': 'Contrato_N', 'OBRA': 'OBRA', 'INTERLIG': 'INTERLIG', 'Observ': 'Observ', 'Método': 'Método', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.set('fieldImages', {'NUM_CONTRA': 'TextEdit', 'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'WBS_TEXT': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'DateTime', 'DT_TER_OBR': 'DateTime', 'DT_PAV_PRO': 'DateTime', 'DT_PAV_DEF': 'DateTime', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.set('fieldImages', {'OBJ_REDUZI': 'TextEdit', 'DIAMETR_MM': 'TextEdit', 'PROF_MED_M': 'TextEdit', 'METODO': 'TextEdit', 'TIPO': 'TextEdit', 'MUNICIPIO': 'TextEdit', 'BAIRRO': 'TextEdit', 'LOGRADOURO': 'TextEdit', 'FRENTE': 'TextEdit', 'DETA_METOD': 'TextEdit', 'DT_INI_OBR': 'DateTime', 'DT_TER_OBR': 'DateTime', 'DT_PAV_PRO': 'DateTime', 'DT_PAV_DEF': 'DateTime', 'STATUS_C': 'TextEdit', 'STATUS': 'TextEdit', 'OperadoPor': 'TextEdit', 'Tipo_Colet': 'TextEdit', 'Sub_Tipo': 'TextEdit', 'Posicao_Re': 'TextEdit', 'Estado': 'TextEdit', 'Tipo_Sec': 'TextEdit', 'Diametro': 'TextEdit', 'Dim_Sec': 'TextEdit', 'Comp_Real': 'TextEdit', 'Material': 'TextEdit', 'Prof_GI_M': 'TextEdit', 'Prof_GI_J': 'TextEdit', 'Lig_M': 'TextEdit', 'Estad_Cons': 'TextEdit', 'Tipo_Escoa': 'TextEdit', 'Data_Inst': 'DateTime', 'Data_Oper': 'DateTime', 'Cadast?': 'TextEdit', 'Numero_BP': 'TextEdit', 'Metod_Cons': 'TextEdit', 'Proprieta': 'TextEdit', 'Contrato_N': 'TextEdit', 'OBRA': 'TextEdit', 'INTERLIG': 'TextEdit', 'Observ': 'TextEdit', 'Método': 'TextEdit', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVUGUAU__PCT_20_1.set('fieldLabels', {'NUM_CONTRA': 'no label', 'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'WBS_TEXT': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.set('fieldLabels', {'OBJ_REDUZI': 'no label', 'DIAMETR_MM': 'no label', 'PROF_MED_M': 'no label', 'METODO': 'no label', 'TIPO': 'no label', 'MUNICIPIO': 'no label', 'BAIRRO': 'no label', 'LOGRADOURO': 'no label', 'FRENTE': 'no label', 'DETA_METOD': 'no label', 'DT_INI_OBR': 'no label', 'DT_TER_OBR': 'no label', 'DT_PAV_PRO': 'no label', 'DT_PAV_DEF': 'no label', 'STATUS_C': 'no label', 'STATUS': 'no label', 'OperadoPor': 'no label', 'Tipo_Colet': 'no label', 'Sub_Tipo': 'no label', 'Posicao_Re': 'no label', 'Estado': 'no label', 'Tipo_Sec': 'no label', 'Diametro': 'no label', 'Dim_Sec': 'no label', 'Comp_Real': 'no label', 'Material': 'no label', 'Prof_GI_M': 'no label', 'Prof_GI_J': 'no label', 'Lig_M': 'no label', 'Estad_Cons': 'no label', 'Tipo_Escoa': 'no label', 'Data_Inst': 'no label', 'Data_Oper': 'no label', 'Cadast?': 'no label', 'Numero_BP': 'no label', 'Metod_Cons': 'no label', 'Proprieta': 'no label', 'Contrato_N': 'no label', 'OBRA': 'no label', 'INTERLIG': 'no label', 'Observ': 'no label', 'Método': 'no label', });
lyr_0079724_ME_DO_ALTO_BAQUIRIVU_GUAUPCT_20_2.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});
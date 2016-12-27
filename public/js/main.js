var tilesPath = 'tiles/';
var indexJson = 'tiles/index.json';

var map;
var baseLayer;
var baseMaps = {};
var overlayMaps = {};
var layerControl;

function clearLayers() {
    baseMaps = {};
    overlayMaps = {};
    if (layerControl) {
        map.removeControl(layerControl);
    }
    map.eachLayer(function(layer) {
        map.removeLayer(layer);
    });
}

function loadCelestialBodyData(celestialBody) {
    clearLayers();

    $.getJSON(tilesPath + celestialBody + '/index.json', function(data) {
        var i;
        var layers = data.layers;
        for (i = 0; i < layers.length; i++) {
            if (layers[i].base) {
                baseMaps[layers[i].name] = L.tileLayer('tiles/{id}/{mapPath}/{z}/{x}/{y}.jpg', {
                    attribution: 'Map data ' + layers[i].license + ' <a href="' + layers[i].href + '">' + layers[i].author + '</a>',
                    maxZoom: 18,
                    id: celestialBody,
                    mapPath: layers[i].path
                });
                baseMaps[layers[i].name].addTo(map);
            }
        }
        layerControl = L.control.layers(baseMaps, overlayMaps);
        layerControl.addTo(map);
        map.setZoom(0);
    })
}

function initCelestialBodies() {
    $.getJSON(indexJson, function(data) {
        var options = '';
        var i;

        if (data) {
            for (i = 0; i < data.length; i++) {
                options += '<option value="' + data[i].path + '">' + data[i].name + '</option>';
            }
            $('select[name=celestialbody]').html(options);

            var value = $('select[name=celestialbody] option:selected').val()
            changeCelestialBody(value);
        }
    });
}

function changeCelestialBody(bodyId) {
    if (baseLayer) {
        map.removeLayer(baseLayer);
    }

    loadCelestialBodyData(bodyId);
}

$(document).ready(function() {
    map = L.map('map').setView([0, 0], 0);

    initCelestialBodies();

    $('select[name=celestialbody]').change(function(event) {
        var value = $('select[name=celestialbody] option:selected').val();
        changeCelestialBody(value);
    });

});
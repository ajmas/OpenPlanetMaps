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

function renderPopup(properties) {
    var html = '';
    html += '<div style="font-weight:bold">' + properties.name + '</div>';
    html += '<ul>';
    html += '<li>type: ' + properties.type + '</li>';
    if (properties.link) {
        html += '<li><a href="' + properties.link + '">details</a></li>';
    }
    html += '</ul>';
    return html;
}

function loadFeatures(celestialBody, layerDetails) {
    console.log(tilesPath + celestialBody + '/' + layerDetails.path + '/features.geojson')
    $.getJSON(tilesPath + celestialBody + '/' + layerDetails.path + '/features.geojson', function(data) {
        // console.log(data);

        var labelMarkerOptions = {
            opacity: 1,
            fillOpacity: 0
        };

        overlayMaps[layerDetails.name] = L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                // return L.Marker(latlng, labelMarkerOptions); //.bindLabel(feature.properties.Name, { noHide: true });
                return L.circleMarker(latlng, labelMarkerOptions);
            },
            onEachFeature: function(feature, layer) {
                // does this feature have a property named popupContent?
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(renderPopup(feature.properties));
                }
            }
        });
        overlayMaps[layerDetails.name].addTo(map);

        if (layerControl) {
            map.removeControl(layerControl);
        }
        layerControl = L.control.layers(baseMaps, overlayMaps);
        layerControl.addTo(map);
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
            } else {
                if (layers[i].type === 'features') {
                    loadFeatures(celestialBody, layers[i]);
                }
            }
        }

        var latLonLines = L.graticule().addTo(map);
        //L.graticule({ interval: 20 }).addTo(map);
        overlayMaps['lat-lon lines'] = latLonLines;

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
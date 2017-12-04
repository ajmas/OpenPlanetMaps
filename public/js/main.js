var tilesPath = './tiles/';
var indexJson = './tiles/index.json';

var map;
var baseLayer;
var baseMaps = {};
var overlayMaps = {};
var layerControl;
var celestialBodiesById;

var geojsonMarkerOptions = {
    radius: 4,
    fillColor: "#00f",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};

function clearLayers() {
    baseMaps = {};
    overlayMaps = {};
    if (layerControl) {
        map.removeControl(layerControl);
    }
    map.eachLayer(function(layer) {
        map.removeLayer(layer);
    });
    map.panTo(new L.LatLng(0,0));
}

function loadCelestialBodyData(celestialBody) {
    clearLayers();



    $.getJSON(tilesPath + celestialBody + '/index.json', function(data) {
        var i;
        var layers = data.layers;
        var defaultBaseLayer;
        for (i = 0; i < layers.length; i++) {
            if (layers[i].baseLayer) {
                var path = layers[i].path;
                if (path.startsWith(celestialBody + '/')) {
                    path = path.substring(celestialBody.length + 1, path.length);
                }
                baseMaps[layers[i].name] = L.tileLayer(tilesPath + '{id}/{mapPath}/{z}/{x}/{y}.png', {
                    attribution: 'Map data ' + layers[i].license + ' <a href="' + layers[i].href + '">' + layers[i].author + '</a>',
                    id: celestialBody,
                    mapPath: path
                });
                if (!defaultBaseLayer) {
                    defaultBaseLayer = baseMaps[layers[i].name];
                }
            } else if (layers[i].type === 'features') {
                // Assuming features are geojson.
                var path = tilesPath + layers[i].path;
                overlayMaps[layers[i].name] = new L.GeoJSON.AJAX(path + '/features.geojson', {
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    },
                    // middleware:function(data){
                    //    console.log(data);
                    //    if (data.features) {
                    //       var features = data.features;
                    //       for (var i=0; i<features.length; i++) {
                    //          var properties = features[i].properties;
                    //          properties.name = properties.Name;
                    //       }
                    //    }
                    //    return data;
                    // },
                    onEachFeature: function (feature, layer) {
                        layer.bindTooltip(feature.properties.Name);
                    }
                });
            } else {
                console.warn('unknown layer type:', layers[i].type);
            }
        }
        layerControl = L.control.layers(baseMaps, overlayMaps);
        layerControl.addTo(map);
        map.setZoom(3);
        map.panTo(new L.LatLng(0,0));

        // Display a base layer by default
        if (defaultBaseLayer) {
            defaultBaseLayer.addTo(map);
        }
    })
}

function onClick(event) {
    if (event.target.localName !== 'span') {
        return
    }
    var id = event.target.parentNode.id;
    var celestialBody = celestialBodiesById[id];
    $('.navbar-nav li').removeClass('active');
    $('#' + id).addClass('active');
    changeCelestialBody(celestialBody.path)
}

function initCelestialBodies() {
    $.getJSON(indexJson, function(data) {
        var options = '';
        var i;

        if (data) {
            celestialBodiesById = {};
            var celestialBodies = data.entries;
            for (i = 0; i < celestialBodies.length; i++) {
                if (!celestialBodies[i].id) {
                    celestialBodies[i].id = celestialBodies[i].path;
                }
                celestialBodiesById[celestialBodies[i].id] = celestialBodies[i];
                options += '<li class="nav-item ' + celestialBodies[i].id + '" id="' + celestialBodies[i].id + '"><span>' + celestialBodies[i].name + '</span></li>';
            }
            $('.navbar-nav').html(options);
            $('.navbar-nav li').eq(0).addClass('active');

            $('.navbar-nav > li > span').on('click', onClick);

            changeCelestialBody(celestialBodies[0].path);
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
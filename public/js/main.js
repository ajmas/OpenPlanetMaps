var tilesPath = './tiles/';
var indexJson = './tiles/index.json';

var map;
var baseLayer;
var baseMaps = {};
var overlayMaps = {};
var layerControl;
var celestialBodiesById;

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
    console.log('celestialBody', celestialBody);
    $.getJSON(tilesPath + celestialBody + '/index.json', function(data) {
        var i;
        var layers = data.layers;
        for (i = 0; i < layers.length; i++) {
            if (layers[i].base) {
                baseMaps[layers[i].name] = L.tileLayer(tilesPath + '{id}/{mapPath}/{z}/{x}/{y}.jpg', {
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

        console.log('data', data);
        if (data) {
            celestialBodies = data;
            celestialBodiesById = {};
            var entries = celestialBodies;
            for (i = 0; i < entries.length; i++) {
                if (!entries[i].id) {
                    entries[i].id = 'nav-entry-' + i;
                }
                celestialBodiesById[entries[i].id] = entries[i];
                options += '<li class="nav-item ' + entries[i].id + '" id="' + entries[i].id + '"><span>' + entries[i].name + '</span></li>';
            }
            console.log(options);
            $('.navbar-nav').html(options);
            $('.navbar-nav li').eq(0).addClass('active');
            
            $('.navbar-nav > li > span').on('click', onClick);

            changeCelestialBody(entries[0].path);
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
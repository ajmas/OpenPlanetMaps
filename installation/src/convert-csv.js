const Promise = require('bluebird');
const fastcsv = require('fast-csv');
const fs = require('fs');
const coordParser = require('./coordinate-parser');

function createGeoJsonFeature(entry) {
    var lat = entry.latitude;
    var lon = entry.longitude;
    var latlon = coordParser.textToLatLon(`${lat}, ${lon}`);

    var feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": latlon
        },
        "properties": entry
    };

    console.log(JSON.stringify(feature, undefined, 2))
    return feature;
}

function createGeoJsonFeatureCollection(entries) {
    var features = entries.filter(function(entry) {
        var name = entry.name || entry.Name;
        if (name && name.trim().length > 0) {
            return entry;
        }
        return undefined;
    });

    features = features.map(function(entry) {
        return createGeoJsonFeature(keysToLowercase(entry));
    });

    return {
        "type": "FeatureCollection",
        "features": features
    };
}

function keysToLowercase(obj) {
    let key, keys = Object.keys(obj);
    let n = keys.length;
    let newObj = {}
    while (n--) {
        key = keys[n];
        newObj[key.toLowerCase()] = obj[key];
    }

    return newObj;
}

function convert(datafile, delimter, ouputFile) {
    return new Promise(function(resolve, reject) {
        var entries = [];
        var stream = fs.createReadStream(datafile);

        var csvStream = fastcsv
            .fromStream(stream, { delimiter: delimter, headers: true })
            .on("data", function(data) {
                entries.push(data);
            })
            .on("end", function() {
                resolve(entries);
            })
            .on("error", function(error) {
                reject(error);
            });
    }).then(function(entries) {
        const geojson = createGeoJsonFeatureCollection(entries);
        // TODO Save
        fs.writeFileSync(ouputFile, JSON.stringify(geojson, undefined, 2), 'UTF8');

        return createGeoJsonFeatureCollection(entries);
    });
}

function toGeoJson(inputFile, ouputFile) {
    if (inputFile.endsWith('.tsv') || inputFile.endsWith('.txt') || inputFile.endsWith('.tab')) {
        return convert(inputFile, '\t', ouputFile);
    } else if (inputFile.endsWith('.csv')) {
        return convert(inputFile, ',', ouputFile);
    }
}

module.exports.toGeoJson = toGeoJson;
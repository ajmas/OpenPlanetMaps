const fs = require('fs');

const winston = require('winston');
const Promise = require('bluebird');
const DOMParser = require('xmldom').DOMParser;
const os = require('os');
const unzip = require('unzip');
const toGeoJSON = require('togeojson');
const tmp = require('tmp');

function isFileExists(path) {
    return fs.statSync(path).isFile();
}

function toGeoJson(inputFile, outputFile, options) {

    return new Promise(function(resolve, reject) {
        // By default cleanup the temporary directory we create
        if (!options || (options && !options.preventCleanUp)) {
            tmp.setGracefulCleanup();
        }

        // Throw an error if inputFile is not an existing file
        if (!isFileExists(inputFile)) {
            reject(new Error(`${inputFile} does not exist or is not a file`));
            return;
        }

        // Allow the directory to removed in even with files in it
        var tmpObj = tmp.dirSync({
            unsafeCleanup: true
        });

        var tmpDirPath = tmpObj.name;

        winston.debug(`temporary folder for extracted kmz: ${tmpDirPath}`);

        var stream = fs.createReadStream(inputFile)
            .pipe(unzip.Extract({
                path: tmpDirPath
            }));

        stream.on('error', function(err) {
            console.log('nn', err);
            had_error = true;
            reject(err);
        });

        stream.on('close', function() {
            var docKmlPath = [tmpDirPath, 'doc.kml'].join('/');

            var kml = new DOMParser().parseFromString(fs.readFileSync(docKmlPath, 'utf8'));

            var geojson = toGeoJSON.kml(kml);

            fs.writeFileSync(outputFile, JSON.stringify(geojson, undefined, 2), 'utf-8');

            resolve(outputFile);
        });
    });
}

module.exports.toGeoJson = toGeoJson;

// toGeoJson('/Users/ajmas/Development/projects/OpenPlanetMaps/cache/MARS_nomenclature.kmz', '/tmp/out.geojson').then(function(path) {
//     console.log('path', path);
// }).catch(function(error) {
//     console.log(error);
// })
const fs = require('fs');
const childProcess = require('child_process');
const exec = require('child-process-promise').exec;
const Promise = require('bluebird');
const winston = require('winston');
const sizeOf = require('image-size');

function isDirectoryExists(filepath) {
    try {
        return fs.statSync(filepath).isDirectory();
    } catch (error) {
        return false;
    }
}

function mkdirIfMissing(path) {
    if (!isDirectoryExists(path)) {
        fs.mkdirSync(path);
    }
}

function getMaxZoom(inputFile) {
    return new Promise(function(resolve, reject) {
        sizeOf(inputFile, function(err, dimensions) {
            if (err) {
                reject(err);
            } else {
                resolve(dimensions);
            }
        });
    }).then(function(dimensions) {
        var z = 0;
        var width = -1;
        do {
            z++;
            width = 256 * Math.pow(2, z);
        } while (width < dimensions.width);
        return z;
    });
}

// TODO check if if tiles have already been generated for zoom level

function generateTiles(inputFile, outputdir, minZoom, maxZoom, planetRadiusKm) {

    var sequence;

    if (maxZoom === -1 || maxZoom === undefined) {
        sequence = getMaxZoom(inputFile);
    } else {
        sequence = Promise.resolve(maxZoom);
    }

    sequence = sequence.then(function(maxZoom) {
        winston.debug(`max zoom for ${inputFile}: ${maxZoom}`);

        let z;
        let zoomLevels = [];
        for (z = minZoom; z <= maxZoom; z++) {
            zoomLevels.push(z);
        }

        return Promise.mapSeries(zoomLevels, function(zoomLevel) {
            const width = 256 * Math.pow(2, zoomLevel);
            const height = width;
            const planetWidthKm = planetRadiusKm * Math.PI * 2;
            const metresPerPixel = (planetWidthKm * 1000) / width;

            winston.debug(`Generating tiles for zoom level ${zoomLevel}`);
            winston.debug(`    meters/pixel: ${metresPerPixel}`);

            mkdirIfMissing(`${outputdir}/${zoomLevel}`);

            return exec(`convert "${inputFile}" -resize ${width}x${height}\! -crop 256x256 -set filename:tile "%[fx:page.x/256+1]-%[fx:page.y/256+1]" +repage +adjoin "${outputdir}/${zoomLevel}/%[filename:tile].jpg"`)
                .then(function(result) {
                    let x, y;
                    const tilesPerSide = Math.pow(2, zoomLevel);
                    for (x = 0; x < tilesPerSide; x++) {
                        winston.debug(`    Processing ${outputdir}/${zoomLevel}/${x}`);
                        try {
                            fs.mkdirSync(`${outputdir}/${zoomLevel}/${x}`);
                        } catch (error) {
                            // It is okay if file already exists
                            if (error.code !== 'EEXIST') {
                                throw error;
                            }
                        }
                        for (y = 0; y < tilesPerSide; y++) {
                            fs.renameSync(`${outputdir}/${zoomLevel}/${(x+1)}-${(y+1)}.jpg`, `${outputdir}/${zoomLevel}/${x}/${y}.jpg`);
                        }
                    }
                    return zoomLevel;
                });
        });
    });

    return sequence.catch(function(error) {
        winston.debug('error', error);
    });


}

// const outPath = 'tiles'; //'/Volumes/Flexigo Bravo/OpenPlanetMaps/generated/tiles'
// var earthRadiusKm = 6372.7982;
// var marsRadiusKm = 3396.2;

// mkdirIfMissing(`${outPath}/mars`);
// generateTiles("input/Mars_Viking_MDIM21_ClrMosaic_1km.jpg", `${outPath}/mars`, 0, 5, marsRadiusKm);

module.exports.generateTiles = generateTiles;
// mkdirIfMissing(`${outPath}/earth`);
// generateTiles("input/world.topo.bathy.200412.3x5400x2700.jpg", `${outPath}/earth`, 0, 16, marsRadiusKm);
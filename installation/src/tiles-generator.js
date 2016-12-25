const fs = require('fs');
const childProcess = require('child_process');
const exec = require('child-process-promise').exec;
const promise = require('bluebird');

function isFileExists(filepath) {
    try {
        return fs.statSync(filepath).isFile();
    } catch (error) {
        return false;
    }
}


function mkdirIfMissing(path) {
    // TODO differentiate between already existing and other exceptions
    if (isFileExists(path)) {
        fs.mkdirSync(path);
    }
}

function generateTiles(inputFile, outputdir, minZoom, maxZoom, planetRadiusKm) {
    var z;

    var sequence = Promise.resolve();

    for (z = minZoom; z <= maxZoom; z++) {
        const zoomLevel = z;
        const width = 256 * Math.pow(2, z);
        const height = width;
        const planetWidthKm = planetRadiusKm * Math.PI * 2;
        const metresPerPixel = (planetWidthKm * 1000) / width;
        mkdirIfMissing(`${outputdir}/${z}`);

        console.log(`Generating tiles for zoom level ${zoomLevel}`);
        console.log(`    meters/pixel: ${metresPerPixel}`);

        sequence = sequence.then(function(zoom) {
            return exec(`convert "${inputFile}" -resize ${width}x${height}\! -crop 256x256 -set filename:tile "%[fx:page.x/256+1]-%[fx:page.y/256+1]" +repage +adjoin "${outputdir}/${zoomLevel}/%[filename:tile].jpg"`).then(function(z, result) {
                let x, y;
                const tilesPerSide = Math.pow(2, zoomLevel);
                for (x = 0; x < tilesPerSide; x++) {
                    fs.mkdirSync(`${outputdir}/${zoomLevel}/${x}`);
                    for (y = 0; y < tilesPerSide; y++) {
                        fs.renameSync(`${outputdir}/${zoomLevel}/${(x+1)}-${(y+1)}.jpg`, `${outputdir}/${zoomLevel}/${x}/${y}.jpg`);
                    }
                }
            });
        });
    }

    sequence.catch(function(error) {
        console.log('error', error);
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
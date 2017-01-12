const fs = require('fs-extra');
const path = require('path');

const request = require('request');
const mkdirp = require('mkdirp');
const winston = require('winston');

const convertCub = require('./convert-cub');
const convertCSV = require('./convert-csv');
const tilesGenerator = require('./tiles-generator');

const config = require('../config.json');
const url = require('url');

const supportedDataTypes = ['feature', 'raster', 'vector'];
const ignoredFiles = ['.DS_Store'];

function isFileExists(filepath) {
    try {
        return fs.statSync(filepath).isFile();
    } catch (error) {
        return false;
    }
}

function isDirectoryExists(filepath) {
    try {
        return fs.statSync(filepath).isDirectory();
    } catch (error) {
        return false;
    }
}

/**
 * Used to ensure fileFolderPath is absolute, providing support for
 * relative paths to either be relative to application or working directory.
 * 
 */
function absolutePath(fileFolderPath, relativeToApp) {
    if (!fileFolderPath.startsWith('/')) {
        if (relativeToApp) {
            return path.resolve([__dirname, '..', fileFolderPath].join('/'));
        } else {
            return path.resolve(fileFolderPath);
        }
    }
    return fileFolderPath;
}

/**
 * Promise based function to fetch and store the data for the dataset.
 * If file already exists it won't be fetched, unless overWrite is 'true'.
 */
function fetchData(dataUrl, writeToPath, overWrite) {

    if (dataUrl.startsWith('/')) {
        return Promise.resolve(dataUrl);
    }

    var filename = dataUrl.substring(dataUrl.lastIndexOf('/') + 1, dataUrl.length);
    var path = `${writeToPath}/${filename}`;

    if (overWrite === undefined) {
        overWrite = false;
    }

    if (filename.length > 255) {
        throw new Error('name too long: ' + filename);
    }

    return new Promise(function(resolve, reject) {
        if (!overWrite && isFileExists(path)) {
            return resolve(`${path}`);
        }

        var writeStream = fs.createWriteStream(`${path}`);

        writeStream.on('finish', function() {
            resolve(`${path}`);
        });

        request
            .get(dataUrl)
            .on('error', function(err) {
                reject(error);
            })
            .pipe(writeStream);
    });
}

function celestialObjects(path, callback) {
    fs.readdir(path, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            const childPath = [path, items[i]].join('/');
            const celestialObject = items[i];

            if (ignoredFiles.indexOf(items[i]) > -1) {
                continue;
            }

            fs.stat(childPath, function(err, stats) {
                if (stats.isDirectory()) {
                    datasetTypes(childPath, celestialObject, callback);
                }
            });

            const celestialObjectInfoFile = [childPath, 'index.json'].join('/');
            fs.stat(celestialObjectInfoFile, function(error, stats) {
                if (error) {
                    if (error.code === 'ENOENT') {
                        winston.debug('warn', `no info for ${celestialObject}`);
                    } else {
                        winston.debug('error', error);
                    }
                } else if (stats.isFile()) {
                    winston.debug(`exists, info for ${celestialObject}`);
                    readJsonFile(celestialObjectInfoFile);
                }
            });
        }
    });
}

function datasetTypes(path, celestialObject, callback) {
    fs.readdir(path, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            const childPath = [path, items[i]].join('/');
            const datasetType = items[i];

            if (ignoredFiles.indexOf(items[i]) > -1) {
                continue;
            }

            if (supportedDataTypes.indexOf(datasetType) > 0) {
                //winston.debug(celestialObject, datasetType, childPath);
                datasets(childPath, celestialObject, datasetType, callback);
            }
        }
    });
}

function datasets(path, celestialObject, datasetType, callback) {
    fs.readdir(path, function(err, items) {
        for (var i = 0; i < items.length; i++) {
            const dataset = items[i];
            const datasetFile = [path, dataset, 'index.json'].join('/');

            if (ignoredFiles.indexOf(items[i]) > -1) {
                continue;
            }

            fs.stat(datasetFile, function(error, stats) {
                if (error) {
                    if (error.code === 'ENOENT') {
                        winston.debug('warn', `no dataset File for path ${datasetFile}`);
                    } else {
                        winston.debug('error', error);
                    }
                } else if (stats.isFile()) {
                    //winston.debug(`exists, info for ${celestialObject}/${datasetType}/${dataset}`);
                    callback(`${celestialObject}/${datasetType}/${dataset}`);
                    readJsonFile(datasetFile);
                }
            });
        }
    });
}

function readJsonFile(filePath) {
    const fullFilePath = path.resolve(filePath);
    const rawConfig = fs.readFileSync(fullFilePath);
    return JSON.parse(rawConfig);
}


function getImage(images, quality, useCub) {
    var i, url;
    for (i = 0; i < images.length; i++) {
        if (!url) {
            url = images[i].url;
        } else if (url && (quality && images[i].quality === quality) && (url.endsWith('.cub') === useCub)) {
            url = images[i].url;
        }
    }
    return url;
}

function initLogger() {
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        level: 'debug',
        silent: false,
        colorize: true
    });
}

function processRaster(dataset, path, planetInfo) {
    const imageUrl = getImage(dataset.source.images, 'high', false);

    // Minimize download & conversion where possible:
    //  - If file not in cache, fetch
    //  - If file needs converting and output not in cache, convert
    //  - If tiles not present, generate

    // Attempt to fetch the file, but don't overwrite if it already exists
    return fetchData(imageUrl, config.cachePath, false).then(function(imagePath) {
        winston.debug(`finished downloading to ${imagePath}`);
        if (imagePath.endsWith('.cub')) {
            // Attempt to convert the file, unless the output file already exists
            var outputFileName = path.replace(/[ \/]/g, '-') + '.png';
            var outputFilePath = [config.cachePath, outputFileName].join('/');
            winston.debug(`outputFilePath: ${outputFilePath}`);
            if (!isFileExists(outputFilePath)) {
                return convertCub.toPNG(
                    imagePath, outputFilePath
                );
            } else {
                return outputFilePath;
            }
        } else {
            return imagePath;
        }
    }).then(function(imagePath) {
        winston.debug(`generateTiles: ${imagePath} --> ${outputPath}/tiles/${path}`);
        return tilesGenerator.generateTiles(imagePath, `${outputPath}/tiles/${path}`, 0, -1, planetInfo.equitorialRadius, regenerateTiles);
    }).then(function(result) {
        winston.info(result);
    }).catch(function(error) {
        winston.error(error);
    });
}

function processFeatures(dataset, datasetFolder, path, planetInfo) {
    var datafile = dataset.source.data;
    console.log('url.parse(datafile).protocol:', url.parse(datafile).protocol)
    if (url.parse(datafile).protocol === null) {
        datafile = [datasetFolder, datafile].join('/');
    }
    console.log('datafile:', datafile)
    return fetchData(datafile, config.cachePath, false).then(function(filePath) {
        console.log('zzz', filePath)
        const folder = `${outputPath}/tiles/${path}`;
        return convertCSV.toGeoJson(filePath, [folder, 'features.geojson'].join('/')).then(function(geojson) {
            // console.log(geojson);
        });
    }).catch(function(error) {
        winston.error(error);
    });
}

function processCelestialObject(path, regenerateTiles) {
    const planetsDataPath = absolutePath(config.planetsDataPath, true);
    const outputPath = absolutePath(config.outputPath, true);

    var destFolder = `${outputPath}/tiles/${path}`;
    if (!fs.existsSync(destFolder)) {
        mkdirp.sync(destFolder);
    };

    var fields = path.split('/');

    var celestialObject = fields[0];
    var datasetType = fields[1];
    var planetInfo = readJsonFile(`${planetsDataPath}/${celestialObject}/index.json`);
    var dataset = readJsonFile(`${planetsDataPath}/${path}/index.json`);

    fs.copySync(
        `${planetsDataPath}/${celestialObject}/index.json`,
        `${outputPath}/tiles/${celestialObject}/index.json`
    );

    var data = {
        name: dataset.name,
        description: dataset.description,
        author: dataset.author,
        license: dataset.license,
        updated: dataset.updated,
        href: dataset.linkTo,
        radius: planetInfo.equitorialRadius
    };

    var outputFolder = `${outputPath}/tiles/${path}/`;
    fs.mkdirsSync(outputFolder);
    winston.debug('writing to: ', outputFolder);
    fs.writeFileSync(`${outputFolder}/index.json`, JSON.stringify(data, undefined, 2), 'utf-8');

    if (!isFileExists(`${outputPath}/tiles/${path}`)) {
        console.log('generating: ' + `${path}`)

        if (datasetType === "raster") {
            processRaster(dataset, path, planetInfo);
        } else if (datasetType === "features") {
            processFeatures(dataset, `${planetsDataPath}/${path}`, path, planetInfo);
        } else {
            winston.debug(`unsupported dataset type: ${datasetType}`);
        }
    }
}

// -------------------------------------------------
// -------------------------------------------------

const planetsDataPath = absolutePath(config.planetsDataPath, true);
const outputPath = absolutePath(config.outputPath, true);
const staticFilesPath = absolutePath(config.staticFilesPath, true);

var regenerateTiles = false;

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: 'debug',
    silent: false,
    colorize: true
});

// console.log('__filename', path.resolve([__dirname, '../public'].join('/')));
winston.debug(`Copying ${staticFilesPath} to ${outputPath}`);

// fs.copySync(staticFilesPath, outputPath);

// processCelestialObject('venus/raster/visible', regenerateTiles);
processCelestialObject('moon/features/geological', regenerateTiles);
//celestialObjects(planetsDataPath, processCelestialObject);
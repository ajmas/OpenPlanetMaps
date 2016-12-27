const fs = require('fs-extra');
const request = require('request');
const mkdirp = require('mkdirp');
const winston = require('winston');

const cub2Png = require('./cub-to-png');
const tilesGenerator = require('./tiles-generator');

const configPath = './config.json';
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
 * Promise based function to fetch and store the data for the dataset
 */
function fetchData(url, writeToPath, overWrite) {
    var filename = url.substring(url.lastIndexOf('/') + 1, url.length);
    var path = `${writeToPath}/${filename}`;

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
            .get(url)
            // .on('response', function(response) {
            //     winston.debug(response.statusCode) // 200 
            //     winston.debug(response.headers['content-type']) // 'image/png' 
            //         // reject(new Error('booom'));
            // })
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

function readJsonFile(path) {
    const rawConfig = fs.readFileSync(path);
    return JSON.parse(rawConfig);
}

function loadConfig() {
    return readJsonFile(configPath);
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

// -------------------------------------------------
// -------------------------------------------------

const config = loadConfig();

const planetsDataPath = config.planetsDataPath;
const outputPath = config.outputPath;
const staticFilesPath = config.staticFilesPath;

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: 'debug',
    silent: false,
    colorize: true
});

fs.copySync(staticFilesPath, outputPath);

celestialObjects(planetsDataPath, function(path) {
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
            const imageUrl = getImage(dataset.source.images, 'high', false);

            fetchData(imageUrl, config.cachePath, false).then(function(imagePath) {
                winston.debug(`finished downloading to ${path}`);
                if (path.endsWith('.cub')) {
                    return cubToPng.convert(imagePath, "out.png");
                } else {
                    return imagePath;
                }
            }).then(function(imagePath) {
                winston.debug(`generateTiles: ${imagePath} --> ${outputPath}/tiles/${path}`);
                return tilesGenerator.generateTiles(imagePath, `${outputPath}/tiles/${path}`, 0, 6, planetInfo.equitorialRadius);
            }).then(function(result) {
                winston.info(result);
            }).catch(function(error) {
                winston.error(error);
            });
        }
    }
});
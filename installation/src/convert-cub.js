const promise = require('bluebird');
const exec = require('child-process-promise').exec;
const winston = require('winston');
const path = require('path');

// http://planetarygis.blogspot.ca/2014/12/what-is-isis-3-cube-format.html
// http://www.gdal.org/gdal_translate.html

function toFileType(inputFile, outputFile, fileType) {
    var cmdLine = `gdal_translate -of ${fileType} "${inputFile}" "${outputFile}"`;
    var resolvedPath = path.resolve(outputFile);
    winston.debug('cmdLine', cmdLine);
    return exec(cmdLine)
        .then(function(result) {
            //winston.debug(result);
            return resolvedPath;
        });
}

function toTIFF(inputFile, outputFile) {
    return toFileType(inputFile, outputFile, 'GTIFF');
}

function toPNG(inputFile, outputFile) {
    return toFileType(inputFile, outputFile, 'PNG');
}

function toJPEG(inputFile, outputFile) {
    return toFileType(inputFile, outputFile, 'JPEG');
}

if (module.filename === process.mainModule.filename) {
    var inputFile = process.argv[2];
    var outputFile = process.argv[3]
    var lowercaseName = outputFile.toLowerCase();

    winston.debug(`converting '${inputFile}' to '${outputFile}'`);
    Promise.resolve().then(function() {
        if (lowercaseName.endsWith('.jpg') || lowercaseName.endsWith('.jpeg')) {
            return toJPEG(inputFile, outputFile);
        } else if (lowercaseName.endsWith('.png')) {
            return toPNG(inputFile, outputFile);
        } else if (lowercaseName.endsWith('.tiff')) {
            return toTIFF(inputFile, outputFile);
        } else {
            throw new Error('unsupported output type');
        }
    }).then(function(path) {
        winston.debug('convert output: ' + path);
    }).catch(function(error) {
        winston.error(error);
    })

} else {
    module.exports.toPNG = toPNG;
    module.exports.toJPEG = toJPEG;
    module.exports.toTIFF = toTIFF;
}
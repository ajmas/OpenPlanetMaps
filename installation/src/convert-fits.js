const promise = require('bluebird');
const exec = require('child-process-promise').exec;

// http://www.gdal.org/frmt_various.html#FITS
// http://www.gdal.org/gdal_translate.html

function toFileType(inputFile, outputFile, fileType) {
    return exec(`gdal_translate –of ${fileType} "${inputFile}" "${ouputtFile}"`)
        .then(function(result) {
            //winston.debug
            return outputFile;
        });
}

function toPNG(inputFile, outputFile) {
    return toFileType(inputFile, outputFile, 'PNG');
}

function toJPEG(inputFile, outputFile) {
    return toFileType(inputFile, outputFile, 'Jpeg');
}

module.exports.toPNG = toPNG;
module.exports.toJPEG = toJPEG;
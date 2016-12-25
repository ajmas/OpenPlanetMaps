const promise = require('bluebird');

// http://planetarygis.blogspot.ca/2014/12/what-is-isis-3-cube-format.html

module.exports.convertToPNG = function(inputFile, outputFile) {
    // gdal_translate –of PNG –ot Byte –scale input.cub output_8bit.png
}

module.exports.convertToJPEG = function(inputFile, outputFile) {
    // gdal_translate –of Jpeg –ot Byte –scale input.cub output_8bit.jpg
}
/**
 * Functionality for parsing lat/lon coordinates
 * 
 * @author Andre-John Mas
 */
class CoordinateParser {

    convertDegMinSecToDecDeg(deg, min, sec, direction) {
        var value;

        if (min === undefined) { min = 0; }
        if (sec === undefined) { sec = 0; }

        deg = parseFloat(deg);
        min = parseFloat(min);
        sec = parseFloat(sec);

        value = deg + min / 60 + sec / 3600;

        if (direction && (direction === 'W' || direction === 'S')) {
            value = value * -1;
        }

        return value;
    }

    textToLatLon(text) {
        var regex, result, lat, lon;

        if (!text) {
            return null;
        }

        text = text.trim();

        if (text.startsWith('@')) {
            text = text.substring(1);
        }

        // Deal with the form DDD.DDDDD,DDD.DDDDD ; example: 32.30642, 122.61458
        regex = /^([\-\+]?\d+(\.\d+)?),\s*([\-\+]?\d+(\.\d+)?)$/;

        result = regex.exec(text);
        if (result) {
            if (result.length === 5) {
                //console.log('xxx', result[1], result[3], [parseFloat(result[1]), parseFloat(result[3])])
                return [parseFloat(result[1]), parseFloat(result[3])];
            }
        }

        // Deal with the form DDD.DDDDD° N DDD.DDDDD° W ; example: 32.30642° N 122.61458° W
        regex = /^(\d+(\.\d+)?)° ([NS])\s*(\d+(\.\d+)?)° ([EW])$/;

        result = regex.exec(text);
        if (result) {
            if (result.length === 7) {
                lat = parseFloat(result[1]);
                lon = parseFloat(result[4]);
                if (result[3] === 'S') {
                    lat = lat * -1;
                }
                if (result[6] === 'S') {
                    lon = lon * -1;
                }
                return [lat, lon];
            }
        }

        // Deal with the form DDD° MM' SS.S" N DDD° MM' SS.S" W ; example: 32° 18' 23.1" N 122° 36' 52.5" W
        regex = /([0-9]+)° ([0-9]+)\' ([0-9]+\.?[0-9]*)\" ([NS]) ([0-9]+)° ([0-9]+)\' ([0-9]+\.?[0-9]*)\" ([EW])/;

        result = regex.exec(text);
        if (result) {
            if (result.length === 9) {
                lat = this.convertDegMinSecToDecDeg(result[1], result[2], result[3], result[4]);
                lon = this.convertDegMinSecToDecDeg(result[5], result[6], result[7], result[8]);
                return [lat, lon];
            }
        }

        // Deal with the form DDD° MM.MMM' N DDD° MM.MMM' W ; example: 32° 18.385' N 122° 36.875' W
        regex = /([0-9]+)° ([0-9]+\.?[0-9]*)\' ([NS]) ([0-9]+)° ([0-9]+\.?[0-9]*)\' ([EW])/;

        result = regex.exec(text);
        if (result) {
            if (result.length === 9) {
                lat = this.convertDegMinSecToDecDeg(result[1], result[2], 0, result[3]);
                lon = this.convertDegMinSecToDecDeg(result[4], result[5], 0, result[6]);
                return [lat, lon];
            }
        }

        regex = /((\d+(\.\d+)?)°?\s*([NS])), ((\d+(\.\d+)?)°?\s*([EW]))/;

        result = regex.exec(text);
        if (result) {
            if (result.length === 9) {
                lat = parseFloat(result[2]) * (result[4] === 'S' ? -1 : 1)
                lon = parseFloat(result[6]) * (result[8] === 'W' ? -1 : 1);
                return [lat, lon];
            }
        }

        return;
    }
}

module.exports = new CoordinateParser();

// ref: https://www.maptools.com/tutorials/lat_lon/formats
// ref: http://www.rapidtables.com/convert/number/degrees-minutes-seconds-to-degrees.htm
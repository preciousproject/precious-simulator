"use strict";

const gpxParse = require('gpx-parse');

function radians(n) {
    return n * (Math.PI / 180);
}

function degrees(n) {
    return n * (180 / Math.PI);
}

function getBearing(startLat, startLong, endLat, endLong) {
    startLat = radians(startLat);
    startLong = radians(startLong);
    endLat = radians(endLat);
    endLong = radians(endLong);

    var dLong = endLong - startLong;

    var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
    if (Math.abs(dLong) > Math.PI) {
        if (dLong > 0.0)
            dLong = -(2.0 * Math.PI - dLong);
        else
            dLong = (2.0 * Math.PI + dLong);
    }

    return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

function convertPoints(defaultSpeedInKmh, timeResolution, gpxData, interpolate) {

    function getDistanceInKilometers(a, b) {
        var d = gpxParse.utils.calculateDistance(a.lat, a.lon, b.lat, b.lon);
        return d / 0.62137;
    }

    function convert(o, time) {
        return {
            lat: o.lat, 
            lon: o.lon, 
            elevation: o.elevation,
            time: new Date(time)
        }
    }

    function generateInBetween(previous, current, t1, t2) {

        var deltaLat =  current.lat - previous.lat;
        var deltaLon =  current.lon- previous.lon;
        var deltaEl = current.elevation - previous.elevation;
        var step = timeResolution * 1000;

        var arr = [];

        for (var t = t1 + step; t <= t2 - step; t+= step) {

          var t0_1 = (t - t1) / (t2 - t1);
          var latInter = previous.lat + deltaLat  * t0_1;
          var lonInter = previous.lon + deltaLon  * t0_1;
          var elInter = previous.elevation + deltaEl * t0_1;

          arr.push({
                lat: latInter,
                lon: lonInter,
                elevation: elInter,
                time: new Date(t)
          });
        }

        return arr;
    }

    var currentTime = 0;
    var newGpxData = [];

    for(var i=0; i<gpxData.length; i++) {
        
        if (i == 0) {

            if(gpxData[i].time !== null) {
                currentTime = gpxData[i].time.getTime();
            }

            newGpxData.push(convert(gpxData[i], currentTime));

        } else {

            var current = gpxData[i];
            var previous = gpxData[i-1];
            var distance = Math.abs(getDistanceInKilometers(current, previous));

            var time;

            if(current.time !== null && previous.time !== null) {
                currentTime = current.time.getTime();
                time = currentTime - previous.time.getTime();
            } else {
                time = distance/defaultSpeedInKmh * 60 * 60 * 1000;
                currentTime += time;
            }

            current = convert(gpxData[i], currentTime);
            
            if (interpolate) {
                generateInBetween(previous, current, currentTime-time, currentTime).forEach(function(el) {
                    newGpxData.push(el);
                });
            }

            newGpxData.push(current);
        }

    }

    return newGpxData;
}

module.exports = {
    getBearing: getBearing,
    convertPoints: convertPoints
};
"use strict";

const gpxParse = require('gpx-parse');
const helpers = require('./helperfunctions.js');
const fs = require('fs');
const kmh = 20;
const time = 1;

const memes = [
	{ id: 1, name: "Dickbutt", path: "img/memes/dickbutt.png"},
	{ id: 2, name: "Like A Boss!", path: "img/memes/likeaboss.png"},
	{ id: 3, name: "Like A sir", path: "img/memes/likeasir.png"},
	{ id: 4, name: "Trollface", path: "img/memes/trollface.png"},
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parse(cb) {
	gpxParse.parseGpxFromFile("../route.gpx", function (error, data) {
        if (error !== null) {
            cb(error);
        } else {
            var gpxData = data.tracks[0].segments[0];
            gpxData = helpers.convertPoints(kmh, time, gpxData, false);
            cb(null, gpxData);
        }
    });
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = {
        	pos: arr[x in taken ? taken[x] : x],
        	meme: memes[getRandomInt(0, memes.length-1)]
        };
        taken[x] = --len;
    }
    return result;
}

parse(function(err, data) {
	var memePositions = getRandom(data, Math.round(data.length * 0.3));
	var str = "window.positions = " + JSON.stringify(memePositions);
	fs.writeFile("../js/positions.js", str);
});


"use strict";

//get modules
const electron = require('electron');
const gpxParse = require('gpx-parse');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");
const requestTypes = require('../../modules/precious/request-types');
const helpers = require('./helperfunctions.js');
const fileOpener = require('../../modules/fileopener');

var plugin = new PreciousPlugin("location");

// intervall in milliseconds
var intervall = 1000;

var gpxData = null; // pointer to the data of the gpx file
var gpxDataName = null; // name of the data
var gpxTimer = null; //
var secondCounter = null; // second counter

var gpxCounter = 0; // counter
var active = false; // boolean to store the current state
var myIntervall; // variable to store the setInterval() pointer
var presentData = {speed: null, course: null}; // variable to store the current speed and course

var filenotfound = false;
var defaultSpeedInKmh = 20;
var defaultTimeResolution = 1;
var isConverted = false;

function loadFile() {
    stop();

    $('#gpx-conversion-infoText span').html("");
    isConverted = false;

    var path = $('#gpx-appPath').val();
    ipc.send('set-config', {key: 'gps:path', value: path});

    gpxParse.parseGpxFromFile(path, function (error, data) {

        if (error !== null) {
            gpxData = null;
            filenotfound = true;
        } else {
            gpxData = data.tracks[0].segments[0];
            gpxDataName = data.tracks[0].name;
            filenotfound = false;
        }

        showInfoText();

        /*
         console.log(data.tracks[0].segments[0][i].time.getTime());
         console.log(data.tracks[0].segments[0][i].lat);
         console.log(data.tracks[0].segments[0][i].lon);;*/
    });
}

function intervallFunction() {

    if ((gpxCounter + 1) >= gpxData.length) {
        stop();

        return;
    }

    while (gpxData[gpxCounter + 1].time.getTime() <= gpxTimer) {
        gpxCounter = gpxCounter + 1;
    }

    // calculate the distance
    var distance = -1.0;
    var usedtime = -1.0;
    presentData.speed = -1.0;
    presentData.course = -1.0;

    if (gpxCounter !== 0) {
        distance = gpxParse.utils.calculateDistance(gpxData[gpxCounter - 1].lat, gpxData[gpxCounter - 1].lon, gpxData[gpxCounter].lat, gpxData[gpxCounter].lon);
        distance = distance / 0.62137; // miles to kilometers
        distance = distance * 1000.0; // kilometers to meters

        // calculate time
        usedtime = gpxData[gpxCounter].time.getTime() - gpxData[gpxCounter - 1].time.getTime();
        usedtime = usedtime / 1000.0; // milliseconds to seconds

        // calculate speed in m/s
        presentData.speed = distance / usedtime;

        // calculate course
        presentData.course = helpers.getBearing(gpxData[gpxCounter - 1].lat, gpxData[gpxCounter - 1].lon, gpxData[gpxCounter].lat, gpxData[gpxCounter].lon);
    }

    var hours = Math.floor(secondCounter / 3600);
    var minutes = Math.floor((secondCounter % 3600) / 60);
    var seconds = Math.floor(secondCounter % 60);

    $('#gps-timer').html((hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
    $('#gps-actualposition').html(gpxData[gpxCounter].lat + " / " + gpxData[gpxCounter].lon);
    $('#gps-actualaltitude').html(gpxData[gpxCounter].elevation + " m");
    $('#gps-waypoint').html((gpxCounter + 1) + " / " + gpxData.length);
    $('#gps-actualspeed').html((Math.round(presentData.speed * 100) / 100) + " m/s" + " (" + (Math.round((presentData.speed * 3.6) * 100) / 100) + " km/h)");
    $('#gps-actualcourse').html(Math.round(presentData.course * 100) / 100);

    gpxTimer = gpxTimer + intervall;
    secondCounter = secondCounter + (intervall / 1000.0);
}

function startstop() {
    if (active) {
        stop();
    } else {
        start();
    }
}

function convertGpxData() {

    if(active) stop();

    $('#gpx-conversion-infoText span').empty();
    
    var speed = parseFloat($('#gps-conversion-kmh').val());
    var time = parseFloat($('#gps-conversion-time').val());

    if(isNaN(speed) || isNaN(time)) {
        $('#gpx-conversion-infoText span').html("Invalid speed or time value");
        return;
    }

    if (gpxData == null) {
        $('#gpx-conversion-infoText span').html("Please load data first");
        return;
    }

    if (isConverted) {
        $('#gpx-conversion-infoText span').html("Conversion can only be performed once, please reload your data");
        return;
    }

    var hasTimes = false;
    if (gpxData.length > 0 && gpxData[0].time !== null) {
        hasTimes = true;
    }

    var currentPoints = gpxData.length;
    gpxData = helpers.convertPoints(speed, time, gpxData, true);
    var newPoints = gpxData.length;

    var text = "Converted from " + currentPoints + " to " + newPoints + " waypoints";

    if (hasTimes) {
        text += ", your gpx file contained timestamps, hence speed was not adjusted";
    }

    $('#gpx-conversion-infoText span').html(text);

    isConverted = true;
}

function start() {

    secondCounter = 0;
    gpxCounter = 0;

    if (gpxData.length > 0 && gpxData[0].time == null) {
        console.log("Setting Default Timestamps");
        gpxData = helpers.convertPoints(defaultSpeedInKmh, defaultTimeResolution, gpxData, false);
        console.log("Setting Default Timestamps Done");
    }

    gpxTimer = gpxData[0].time.getTime();

    myIntervall = setInterval(intervallFunction, intervall);
    intervallFunction();

    $('#gps-startstop').text("Stop");
    active = true;
}

function stop() {
    $('#gps-timer').html("-");
    $('#gps-actualposition').html("-");
    $('#gps-actualaltitude').html("-");
    $('#gps-waypoint').html("-");
    $('#gps-actualspeed').html("-");
    $('#gps-actualcourse').html("-");

    presentData.speed = null;
    presentData.course = null;

    if (active) {
        clearInterval(myIntervall);
    }

    $('#gps-startstop').text("Start");
    active = false;
}

function showInfoText() {
    var infoText;
    var hint = "<br /><i>HINT: Please provide the GPX data in the format of simple_example.gpx in ./resources/gpx/</i>";
    var filenotfileText = "<br />Cannot open file or no GPX Data found.";

    if (gpxData === null) {
        infoText = "No GPX data loaded.";
        if (filenotfound) {
            infoText = infoText + filenotfileText;
        }
        $('#gps-startstop').prop("disabled", true);
    } else {
        infoText = "Loaded GPX track called " + gpxDataName + " with " + gpxData.length + " waypoints.";
        $('#gps-startstop').prop("disabled", false);
    }

    $('#gpx-infoText span').html(infoText);
}

//mytype is type of request, interval is ignored if single request is given, but handled with the same callback
plugin.on("default", {interval: intervall, maxContinuousHandlers: 1}, (request, response) => {

    //response.coordinate = {latitude: gpxData[gpxCounter].lat, longitude: gpxData[gpxCounter].lon};

    if (!active) {
        throw new Error("GPS Data unavailable.");
    }

    response.latitude = gpxData[gpxCounter].lat;
    response.longitude = gpxData[gpxCounter].lon;
    response.altitude = gpxData[gpxCounter].elevation;
    response.speed = presentData.speed;
    response.course = presentData.course;
    response.verticalAccuracy = 10.0;
    response.horizontalAccuracy = 10.0;
    response.timestamp = gpxData[gpxCounter].time.getTime();

    return response;
});

//on ready function
$(() => {
    //key for config values: <plugin>:<key>
    //<key> can be alphanumeric, : is hierarchical delimiter
    // a:b:c = ... would mean a:{b:{c:...}}}

    showInfoText();

    $('#gps-loadgpx').click(function () {
        loadFile();
    });

    $('#gps-startstop').click(function () {
        startstop();
    });

    $('#gps-conversion-btn').click(function () {
        convertGpxData();
    });


    $('#gps-startstop').prop("disabled", true);

    $('#gpx-appPath').val(ipc.sendSync('get-config', {key: 'gps:path'}));

    $('#browseFileGps').click(function () {
        var options = {
            title: "Select GPX-File",
            properties: ["openFile"],
            filters: [
                {name: "GPS Exchange Format", extensions: ["gpx"]},
                {name: "All Files", extensions: ["*"]}
            ]
        };

        fileOpener.openFile(options, function (args) {
            if (args.length === 1) {
                $('#gpx-appPath').val(args[0]);
            }
        });
    });

    $('#gps-form').submit(() => {
        loadFile();
    });
});

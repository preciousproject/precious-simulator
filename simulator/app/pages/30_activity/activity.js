"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");

var plugin = new PreciousPlugin("activity");

// if you do a default request, you get the current data from the plugin
plugin.on("default", {interval: 1000, maxContinuousHandlers: 1}, (request, response) => {

    // Activity (startDate, endDate (Timestamps), stationary, walking, running,
    // automotive, cycling, unknown (Booleans), confidence (Int)
    response.startDate = null;
    response.endDate = null;
    response.stationary = $('#activity-stationary').is(':checked');
    response.walking = $('#activity-walking').is(':checked');
    response.running = $('#activity-running').is(':checked');
    response.automotive = $('#activity-automotive').is(':checked');
    response.cycling = $('#activity-cycling').is(':checked');
    response.unknown = $('#activity-unknown').is(':checked');

    response.confidence = $('#activity-confidence').val();

    return response;
});

// if you do a historical request, you get the data of file
/*
plugin.on("historical", {interval: 1000, maxContinuousHandlers: 1}, (request, response) => {

    return response;
});
*/

//on ready function
$(() => {

    $('#activity-stationary').prop('checked', ipc.sendSync('get-config', {key: 'activity:stationary', default: false}));
    $('#activity-stationary').change(() => {
        ipc.send('set-config', {key: 'activity:stationary', value: $('#activity-stationary').is(':checked')});
    });

    $('#activity-walking').prop('checked', ipc.sendSync('get-config', {key: 'activity:walking', default: false}));
    $('#activity-walking').change(() => {
        ipc.send('set-config', {key: 'activity:walking', value: $('#activity-walking').is(':checked')});
    });

    $('#activity-running').prop('checked', ipc.sendSync('get-config', {key: 'activity:running', default: false}));
    $('#activity-running').change(() => {
        ipc.send('set-config', {key: 'activity:running', value: $('#activity-running').is(':checked')});
    });

    $('#activity-automotive').prop('checked', ipc.sendSync('get-config', {key: 'activity:automotive', default: false}));
    $('#activity-automotive').change(() => {
        ipc.send('set-config', {key: 'activity:automotive', value: $('#activity-automotive').is(':checked')});
    });

    $('#activity-cycling').prop('checked', ipc.sendSync('get-config', {key: 'activity:cycling', default: false}));
    $('#activity-cycling').change(() => {
        ipc.send('set-config', {key: 'activity:cycling', value: $('#activity-cycling').is(':checked')});
    });

    $('#activity-unknown').prop('checked', ipc.sendSync('get-config', {key: 'activity:unknown', default: false}));
    $('#activity-unknown').change(() => {
        ipc.send('set-config', {key: 'activity:unknown', value: $('#activity-unknown').is(':checked')});
    });


    $('#activity-confidence').val(ipc.sendSync('get-config', {key: 'activity:confidence', default: 0}));
    $('#activity-confidence').change(() => {
        var confidence = parseInt($('#activity-confidence').val());
        if (confidence < 0 || confidence > 2) confidence = 0;
        $('#activity-confidence').val(confidence);

        ipc.send('set-config', {key: 'activity:confidence', value: confidence});
    });
    
});
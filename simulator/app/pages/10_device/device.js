"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");

var plugin_device_connectivity = new PreciousPlugin("connectivity");
var plugin_device_wifi = new PreciousPlugin("wifi");
var plugin_device_battery = new PreciousPlugin("battery");
var plugin_device_vibration = new PreciousPlugin("vibration");

plugin_device_connectivity.on("default", {interval: 2000}, (request, response) => {

    response.connectivity = $('#device-connectivity').is(':checked');
    return response;
});

plugin_device_wifi.on("default", {interval: 2000}, (request, response) => {

    response.wifi = $('#device-wifi').is(':checked');
    return response;
});

plugin_device_vibration.on("default", {interval: 2000}, (request, response) => {

    // TODO: VIBRATION here

    response.vibration = $('#device-vibration').is(':checked');
    return response;
});

plugin_device_battery.on("default", {interval: 2000}, (request, response) => {

    var batteryState = parseInt($('#device-battery').val());

    if (batteryState < 0 || batteryState > 100) batteryState = 100;
    batteryState /= 100;

    response.battery = batteryState;
    return response;
});

// onLoad
$(() => {
    var device_connectivity = ipc.sendSync('get-config', {key: 'device:connectivity', default: true});
    $('#device-connectivity').prop('checked', device_connectivity);

    $('#device-connectivity').change(() => {
        ipc.send('set-config', {key: 'device:connectivity', value: $('#device-connectivity').is(':checked')});
    });


    var device_wifi = ipc.sendSync('get-config', {key: 'device:wifi', default: true});
    $('#device-wifi').prop('checked', device_wifi);

    $('#device-wifi').change(() => {
        ipc.send('set-config', {key: 'device:wifi', value: $('#device-wifi').is(':checked')});
    });


    var device_battery = ipc.sendSync('get-config', {key: 'device:battery', default: 100});
    $('#device-battery').val(device_battery);

    $('#device-battery').change(() => {
        var batteryState = parseInt($('#device-battery').val());
        if (batteryState < 0 || batteryState > 100) batteryState = 100;
        $('#device-battery').val(batteryState);

        ipc.send('set-config', {key: 'device:battery', value: batteryState});
    });


    var device_vibration = ipc.sendSync('get-config', {key: 'device:vibration', default: true});
    $('#device-vibration').prop('checked', device_vibration);

    $('#device-vibration').change(() => {
        ipc.send('set-config', {key: 'device:vibration', value: $('#device-vibration').is(':checked')});
    });
});

// Prevent submitting via Enter
$(document).ready(function () {
    $('#device-form').keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });
});
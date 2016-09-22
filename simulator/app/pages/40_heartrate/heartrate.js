"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");
const userMessage = require('../../modules/user/message.js');
const fileOpener = require('../../modules/fileopener');

var plugin_device_heartrate = new PreciousPlugin("heartrate");

var fileLoaded = false;
var currentPosition = 0;
var ready = false;
var fileContent;

var value;
var upperBorder;
var lowerBorder;
var showError = false;
var slider = false;

plugin_device_heartrate.on("default", { interval: 2000 }, (request, response) =>
{
    if(!ready || showError)
        throw new Error("No sensor data available!");
    response.heartrate = value;
    nextValue();
    return response;
});

function nextValue()
{
    if($("#radio1").is(':checked'))
    {
        currentPosition++;
        if(currentPosition==fileContent.length) currentPosition = 0;
        value = fileContent[currentPosition].heartrate;
    }
    else if(showError)
    {
        throw new Error("No sensor data available!");
    }
    else if(slider)
    {
        value = $("#slider").val();
    }
    else
    {
        var random = Math.random();
        if(random < 0.4)
            value += Math.random();
        else if(random < 0.8)
            value -= Math.random();
        if(value < lowerBorder) value += Math.random();
        if (value > upperBorder) value -= Math.random();
    }
    showReady();
};

function showReady()
{
    if(ready && !showError) {
        $("#currentBpm").html("Current BPM: " + value);
        $("#colourBox").css("background-color", "#298A08");
    } else {
        $("#currentBpm").html("Current BPM: none");
        $("#colourBox").css("background-color", "#FF0000");
    }
}

function prepare()
{
    ready = false;
    showError = false;
    slider = false;
    if($("#radio1").is(':checked'))
    {
        if(fileLoaded)
        {
            value = fileContent[0].heartrate;
            currentPosition = 0;
            ready = true;
        }
        else
        {
            throw new Error("No file loaded!");
        }
    }
    else if($("#radio2").is(':checked'))
    {
        lowerBorder = 50;
        upperBorder = 90;
        value = Math.random() *(upperBorder-lowerBorder) + lowerBorder;
        ready = true;
    }
    else if($("#radio3").is(':checked'))
    {
        lowerBorder = 90;
        upperBorder = 140;
        value = Math.random() *(upperBorder-lowerBorder) + lowerBorder;
        ready = true;
    }
    else if($("#radio4").is(':checked'))
    {
        lowerBorder = 140;
        upperBorder = 250;
        value = Math.random() *(upperBorder-lowerBorder) + lowerBorder;
        ready = true;
    }
    else if($("#radio5").is(':checked'))
    {
        lowerBorder = 50;
        upperBorder = 250;
        value = Math.random() *(upperBorder-lowerBorder) + lowerBorder;
        ready = true;
    }
    else if($("#radio6").is(':checked'))
    {
        showError = true;
        ready = true;
    }
    else if($("#radio7").is(':checked'))
    {
        slider = true;
        value = $("#slider").val();
        ready = true;
    }
    showReady();
}

function showMessage(message) {
    $('#infoText span').html(message);
}

function loadFile()
{
    var path = $('#heartrate-filePath').val();
    ipc.send('set-config', {key: 'heartrate:path', value: path});
    $.getJSON( path, function( data )
    {
        currentPosition = 0;
        fileContent = data.heartbeat;
        fileLoaded = true;
        if(fileContent.length < 1) {
            showMessage("File does not contain any heartbeat data!");
        }
        else {
            showMessage("File loaded ("+fileContent.length+" values)");
        }

    });
}

$(() => {

    $('#heartrate-filePath').val(ipc.sendSync('get-config', {key: 'heartrate:path'}));

    $('#heartrate-load').click(function ()
    {
        loadFile();
    });

    $('#heartrate-prepare').click(function ()
    {
        prepare();
    });

    $('#heartrate-browse').click(function ()
    {
        var options = {
            title: "Select Heartrate",
            properties: ["openFile"],
            filters: [
                {name: "JSON", extensions: ["json"]},
                {name: "All Files", extensions: ["*"]}
            ]
        };
        fileOpener.openFile(options,function (args) {
            fileLoaded = false;
            console.log(args);
            if (args.length === 1) {
                $('#heartrate-filePath').val(args[0]);
            }
        });
        //ipc.send("open-file", options);
    });
});

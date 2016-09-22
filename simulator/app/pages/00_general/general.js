
"use strict";
const electron = require('electron');
const ipc = electron.ipcRenderer;
const userMessage = require('../../modules/user/message.js');
const PreciousPlugin = require('../../modules/precious/plugin');
const TreeView = require('../../modules/treeview');
const fileOpener = require('../../modules/fileopener');
const JSONEditor = require('jsoneditor');

var startArgumentsPlugin;
/** @type {[]} */
var devices;
var selectedDevice;
var plugin = new PreciousPlugin();

////////////////////////////////////
// plugin status messages
////////////////////////////////////
plugin.on("params",{status:true},(data) => {
    console.log("params handler called");
    console.log(data);
    return {response:'params', params: startArgumentsPlugin.get()};
});

plugin.on('progress', {status: true}, (data) => {
    if(!data.progress)
        return;

    setProgress(data.progress * 100);
});

plugin.on('ready', {status: true}, (data) => {
    setProgress(100).removeClass('progress-bar-warning').addClass('progress-bar-success');
    setStatus('running');

    $('#general-status-dropdown').prop("disabled", false);
});

plugin.on('close', {status: true}, () => {
    ipc.send('close-simulator');
    userMessage.show({msg: 'Simulator requested close.', type: 'info', header: ''})
});

plugin.on('endBackgroundTask', {status:true}, () => {
    reactivateSimulator();
    $('#general-end-bg-time').addClass('disabled');
    $('#general-app-did-enter-bg').removeClass('disabled');

});


////////////////////////////////////
// page behavior
////////////////////////////////////

function endBGTime() {
    ipc.send('app-action', {action:'disablejs'});
}

function reactivateSimulator() {
    ipc.send('app-action', {action:'enablejs'});
    plugin.sendStatus({request:'appDidBecomeActive'});
    setProgress(100).removeClass('progress-bar-warning').addClass('progress-bar-success');
    setStatus('running');
}



function setProgress(progress) {
    var progressBarWrapper = $('#general-app-load');
    progressBarWrapper.find('div').css('width', progress + '%')
        .attr('aria-valuenow', progress);
    var progressBar = progressBarWrapper.find('div.foreground-bar');
    progressBar.find('span').text(progress + '% Complete');
    return progressBar;
}


function setStatus(status) {
    $('#general-app-load span.status').text(status);
}

$(function () {
    $('#general-appPath').val(ipc.sendSync('get-config', {key: 'general:path'}));
    $('#general-startSim').click(function () {
        var path = $('#general-appPath').val();
        var devID = parseInt($('.device-selector:checked').val());
        if(isNaN(devID) || devID < 0 || devID > devices.length) {
            userMessage.show({msg: 'No valid device selected.', type: 'error'});
            return;
        }
        setStatus('starting');
        console.log(devices[devID]);
        ipc.send("start-simulator", {
            path: path,
            width: parseInt(devices[devID].width),
            height: parseInt(devices[devID].height)
        });
        ipc.send('set-config', {key: 'general:path', value: path});
    });
    $('#browseFile').click(function () {
        var options = {
            title: "Select App",
            properties: ["openFile"],
            filters: [
                {name: "HTML", extensions: ["html", "htm"]},
                {name: "All Files", extensions: ["*"]}
            ]
        };
        fileOpener.openFile(options, fileOpened);
        //ipc.send("open-file", options);
    });
    $('#general-stopSim').click(() => {
        ipc.send('close-simulator');
        userMessage.show({msg: 'You stopped the simulation.'})
    });

    var startargs = ipc.sendSync('get-config', [{key: 'general:startarguments:height', default:250},
        {key:'general:startarguments:data', default: {}}
    ]);
    
    $('#general-start-arguments').height(startargs.height);
    new TreeView($('#general-startup-menu'));
    var onArgsChange = () => {ipc.send('set-config', {key:'general:startarguments:data', value:startArgumentsPlugin.get()});};
    startArgumentsPlugin = new JSONEditor(document.getElementById('general-start-arguments'),{search:false, onChange:onArgsChange}, startargs.data);
    
    devices = ipc.sendSync('get-config', {key:'general:devices', default: []});
    var devicesDiv = $('#general-devices');
    var selectedDev = ipc.sendSync('get-config', {key:'general:selecteddevice', default: ''});
    for(var i = 0; i < devices.length; ++i) {
        var checked = '';
        if((selectedDev === '' && i === 0) || selectedDev === devices[i].name) {
            selectedDevice = i;
            checked = ' checked="checked"';
        }
        devicesDiv.append('<div class="radio">' +
            '<label>' +
            '<input class="device-selector" type="radio" name="device" value="' + i + '"' + checked + '>' +
            devices[i].name + ' (' + devices[i].width + 'x' + devices[i].height + 'pt)' +
            '</label>' +
            '</div>');
    }
    $('.device-selector').on('click', function() {
        selectedDevice = $(this).val();
        ipc.send('set-config', {key:'general:selecteddevice', value: devices[selectedDevice].name});
        console.log(devices[selectedDevice].name);
    });

    $('#general-app-status a').click(function() { // function because non-lexical this is needed
        var action = $(this).data('status');

        var end_bg = $('#general-end-bg-time');
        var enter_bg = $('#general-app-did-enter-bg');

        switch (action) {
            case "minimize":
                setStatus('minimized');
                setProgress(100).removeClass('progress-bar-success').addClass('progress-bar-warning');
                break;
            case "appDidEnterBackground":
                if(enter_bg.hasClass('disabled'))
                    return;

                setStatus('app in background');
                setProgress(100).removeClass('progress-bar-success').addClass('progress-bar-warning');
                end_bg.removeClass('disabled');
                enter_bg.addClass('disabled');
                break;
            case "endBackgroundTask":
                if(end_bg.hasClass('disabled'))
                    return;

                end_bg.addClass('disabled');
                enter_bg.removeClass('disabled');
                endBGTime();
                reactivateSimulator();
                return;
                break;
            case "maximize":
                setStatus('running');
                break;
        }


        plugin.sendStatus({request:action});
        ipc.send('app-action', {action: action});
    });
});

////////////////////////////////////
// ipc listener
////////////////////////////////////

/*ipc.on("file-opened", function (event, args) {
    console.log(args);
    if (args && args.length === 1) {
        $('#general-appPath').val(args[0]);
    }
});*/

function fileOpened (args) {
    if (args.length === 1) {
        $('#general-appPath').val(args[0]);
    }
}
ipc.on("simulator-closed", function() {
    setProgress(0).removeClass('progress-bar-warning').removeClass('progress-bar-success');
    setStatus('stopped');

    $('#general-status-dropdown').prop("disabled", true);
    $('#general-end-bg-time').prop('disabled', true);
});

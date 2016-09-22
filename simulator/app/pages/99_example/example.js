"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");

var plugin = new PreciousPlugin("example");

//mytype is type of request, interval is ignored if single request is given, but handled with the same callback
plugin.on("mytype",{interval:2000}, (request, response) => {
    if($('#example-sendError').is(':checked')) {
        throw new Error('Some error occurred.');
    }
    
    response.val = $('#example-return').val();
    return response;
});

//on ready function
$(() => {
    //key for config values: <plugin>:<key>
    //<key> can be alphanumeric, : is hierarchical delimiter
    // a:b:c = ... would mean a:{b:{c:...}}}
    $('#example-return').val(ipc.sendSync('get-config', {key: 'example:value', default: ""})); //reading from config
    $('#example-return').change(() => {
        ipc.send('set-config', {key: 'example:value', value: $('#example-return').val()}); //setting config on change
    });
});
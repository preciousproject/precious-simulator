"use strict";
/*const electron = require('electron');
const ipc = electron.ipcRenderer;
const userMessage = require('../../app/modules/user/message.js');
$(function() {
    $('#appPath').val(ipc.sendSync('get-config',{key:'general:path'}));
    $('#startSim').click(function(){
        var path = $('#appPath').val();
        ipc.send("start-simulator",{path: path});
        ipc.send('set-config',{key:'general:path', value:path});
    });
    $('#browseFile').click(function() {
        var options = {
            title: "Select App",
            properties: ["openFile"],
            filter : [
                { name: "HTML", extensions: ["html", "htm"] },
                { name: "All Files", extensions: ["*"] }
            ]
        };
        ipc.send("open-file", options);
    });
    $('#stopSim').click(() => {
        console.log("stop");
        userMessage.show({msg: 'You stopped the simulation.', persistent: true})
    });
});


ipc.on("file-opened", function(event, args) {
    console.log(args);
    if(args && args.length === 1) {
        $('#appPath').val(args[0]);
    }
});*/

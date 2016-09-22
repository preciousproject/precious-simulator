"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");
const randomstring = require('randomstring');

var plugin = new PreciousPlugin("user");


//on ready function
$(() => {

    $('#User').find('input.userdata').each(function() { //function because non-lexical this is needed
        var input = $(this);
        var keyword = input.data('keyword');
        input.val(ipc.sendSync('get-config', {key: 'user:' + keyword, default: ''}));
        input.change(() => {
            ipc.send('set-config', {key: 'user:' + keyword, value: input.val()});
        });
        plugin.on(keyword, {maxContinuousHandlers: 0}, (request, response) => {
            if(input.val() === '')
                throw new Error('no data available');

            response[keyword] = input.val();
            return response;
        })
    });

    $('#user-generate-ID').click(() => {
        var id = randomstring.generate(32);
        $('#user-userID').val(id).change();
    });
    
});
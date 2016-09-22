"use strict";

//get modules
const electron = require('electron');
const ipc = electron.ipcRenderer;
const PreciousPlugin = require("../../modules/precious/plugin");

var plugin = new PreciousPlugin("storage");

plugin.on('set', {maxContinuousHandlers: 0}, (request, response) => {
    console.log('set');
    localStorage.setItem(request.key, request.value);
    showStorage();
    return response;
});

plugin.on('remove', {maxContinuousHandlers:0}, (request, response) => {
    localStorage.removeItem(request.key);
    showStorage();
    return response;
});

plugin.on('get', {maxContinuousHandlers: 0}, (request, response) => {
    response.value = localStorage.getItem(request.key);
    return response;
});

function createStorageRow(key, value) {

    var html = $('<tr>');
    var keyDiv = $('<div class="key storage-content">').text(key);
    var keyTd = $('<td class="key editable">').append(keyDiv);
    var escapedKey = keyDiv.html();
    keyDiv.attr('data-old-key', escapedKey);
    html.append(keyTd);
    html.append($('<td class="value editable">').append($('<div class="storage-content">').text(value)).append('<div class="entry-menu"><span data-action="edit" class="glyphicon glyphicon-pencil"></span>&nbsp;<span data-action="delete" class="glyphicon glyphicon-trash"></span></div>'));
    html.append('<td class="spaceholder">&#8203;</td>');
    return html;
}


function showStorage() {
    var table = $('#storage-table');
    var body = table.find('tbody');
    body.empty();
    var key, value, html;
    for(var i = 0; i < localStorage.length; ++i) {
        key = localStorage.key(i);
        value = localStorage.getItem(key);
        html = createStorageRow(key, value);
        body.append(html);
    }
    body.append('<tr><td class="entry-menu"><span data-action="new" class="glyphicon glyphicon-plus"></span>&nbsp;<span data-action="refresh" class="glyphicon glyphicon-refresh"></span></td><td></td><td class="spaceholder">&#8203;</td></tr>')
}

$(() => {
    showStorage();
    $('#storage-table').on('click', '.entry-menu span', function() { //function because non-lexical this is needed
        var btn = $(this);
        var action = btn.data('action');
        console.log(action);
        switch (action) {
            case 'edit':
                btn.closest('td').find('div.storage-content').attr('contenteditable','true').focus();
                break;
            case 'delete':
                var row = btn.closest('tr');
                var key = row.find('td.key').text();
                localStorage.removeItem(key);
                row.remove();
                break;
            case 'refresh':
                showStorage();
                break;
            case 'new':
                var i = 0;
                while(localStorage.getItem('newEntry' + i) !== null) ++i;

                localStorage.setItem('newEntry' + i, '');
                var html = createStorageRow('newEntry' + i, '');
                btn.closest('tr').before(html);
                break;
        }
    }).on('dblclick', '.editable', function() { //function because non-lexical this is needed
        $(this).find('div.storage-content').attr('contenteditable', 'true').focus();
    }).on('blur', '.editable div.storage-content', function() { //function because non-lexical this is needed
        var element = $(this);
        var tr = element.closest('tr');
        var value = tr.find('td.value div.storage-content').text();
        var key = tr.find('td.key').text();
        localStorage.setItem(key, value);
        element.removeAttr('contenteditable');

        if(element.hasClass('key')) {
            localStorage.removeItem($('<div>').html(element.attr('data-old-key')).text()); //unescape key, then delete
            element.attr('data-old-key', element.html());
        }
    });
});
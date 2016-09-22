"use strict";

const electron = require('electron');
const ipc = electron.ipcRenderer;
const path = require('path');
window.$ = window.jQuery = require('jquery');
require('bootstrap');
require('bootstrap-select');
$.holdReady(true);

const userMessage = require('./modules/user/message.js');

const emptyDevToolsUrl = "devToolClosed.html";
var pagemodules = [];
var domLoaded = false;
var pages = null;

var devToolHeight;
var screenHeight;
var minDispHeight;
var minDevToolHeight;
var isResizing = false;

window.onerror = function(message, url, lineNumber) {
    ipc.send('log', url+": " + lineNumber + ": " + message);
    return false;
};

function loadPages() {
    ipc.send('log', 'load pages');
    var first = true;
    var tablist = $('#tablist');
    var tabcontent = $('#tab-content');

    var addPage = (p) => {
        var tab = '<li role="presentation"' + (first ? ' class="active"' : '') + '><a href="#' + p.info.name + '" aria-controls="' + p.info.name + '" role="tab" data-toggle="tab">' + p.info.name + '</a></li>';
        tablist = tablist.append(tab);

        var content = '<div role="tabpanel" id="' + p.info.name + '" class="tab-pane' + (first ? ' active' : '') + '" id="' + p.info.name + '">' + p.file + '</div>';
        tabcontent = tabcontent.append(content);
        for(var js of p.info.js) {
            var module = require(path.join(p.dir, js));
            pagemodules.push(module);
            //module.init();
        }

        for(var c of p.info.css)
            $('head').append('<link rel="stylesheet" href="' + path.join(p.dir,c) + '"/>');

        first = false;
    };

    for(const page of pages.pages) {
        if(!page.info.ignore) {
            var p = page;
            var index = pages.plugins.findIndex((el) => el.info.name === page.info.name && !el.info.ignore);
            if (index !== -1) {
                p = pages.plugins[index];
                pages.plugins.splice(index, 1);
            }
            addPage(p);
        }
    }

    for(const page of pages.plugins) {
        if(!page.info.ignore)
            addPage(page);
    }

    pluginsReady();
}

function DOMLoaded(){
    domLoaded = true;
    if(pages != null)
        loadPages();
}

function resize() {
    $('#devToolsApp').height(devToolHeight);
    $('#mainApp').height(screenHeight - devToolHeight);
    $('#tab-content').height(screenHeight - devToolHeight - 42);
}


function pluginsReady() {
    screenHeight = $(window).height();
    var windowConf = ipc.sendSync('get-config', [
        {key:'window:devToolHeight', default:300},
        {key:'window:minDispHeight', default:300},
        {key:'window:minDevToolHeight', default:10} ]);
    devToolHeight = windowConf.devToolHeight;
    minDispHeight = windowConf.minDispHeight;
    minDevToolHeight = windowConf.minDevToolHeight;
    resize();

    $('form').submit((e) => e.preventDefault()); //prevent submit on enter
    $('a').click((e) => { //prevent open new tab on middle mouse button
        if(e.which == 2) //middle mouse button
            e.preventDefault();
    });

    //here to be last ready handler to be called
    $(function () {
        $('#myTabs a').click(function (e) {
            e.preventDefault();
            $(this).tab('show')
        });
        $('#drag').on('mousedown', function() {
            isResizing = true;
            $('#scrollHelper').show();
            //$('body').css('-webkit-user-select', 'none')
        });
        $(window).on('mousemove', function (e) {
            var tmp;
            if(!isResizing || e.clientY < minDispHeight || ((tmp = screenHeight - e.clientY) < minDevToolHeight))
                return;

            devToolHeight = tmp;

            resize();
        }).on('mouseup', function() {
            if(isResizing) {
                $('#scrollHelper').hide();
                ipc.send('set-config', {key: 'window:devToolHeight', value: devToolHeight});
            }
            isResizing = false;

        }).on('resize', function() {
            screenHeight = $(window).height();
            resize();
        });
        ipc.send("main-window-ready");
    });
    $.holdReady(false);
    //setTimeout(()=>$.holdReady(false),5000);
}

ipc.on('pages-loaded', (event, args) => {
    pages = args;
    if(domLoaded)
        loadPages();
});

ipc.on("simulator-started", function(event, args) {

    var devtools = '127.0.0.1:9222';
    var devurl = 'http://' + devtools + '/devtools/inspector.html?ws=' + devtools + '/devtools/page/';
    console.log(devurl);
    $.getJSON('http://' + devtools + '/json', function(json) {
        devurl = devurl + json[0].id;
        $('#devTools').attr("src", devurl);
    }).error((e)=> console.log(e));

});

ipc.on("simulator-closed", function() {
    $('#devTools').attr("src", emptyDevToolsUrl)
});

ipc.on("status-message", function(event, args) {
    userMessage.show(args);
});

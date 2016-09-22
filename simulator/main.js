'use strict';


const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const fs = require('fs');
const path = require('path');


//remote debugging
app.commandLine.appendSwitch('remote-debugging-port', '9222');

/** @type {String} path to current running Simulator */
var openedPath = null;



/** @type {BrowserWindow} main Window of App */
var mainWindow = null;

/** @type {BrowserWindow} Simulator Window */
var simulatorWindow = null;

/** @type {BrowserWindow} loading Window */
var loadingWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {

  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
    //initialize loading window
    loadingWindow = new BrowserWindow({
        width:400,
        height:200,
        frame: false,
        resizable: false,
        maximizable: false,
        useContentSize: true,
        icon: path.join(__dirname, 'resources/icon/precious_diamant_256.png')

    });
    //load urls
    loadingWindow.loadURL('file://' + __dirname + '/app/loading.html');
    loadingWindow.webContents.on('did-finish-load', startMainWindow);

});

app.on('before-quit', function () {
    const conf = require(path.join(__dirname,'app/modules/config'));
    conf.save();
});


function startMainWindow() {
    //initialize main window
    mainWindow = new BrowserWindow({
        width:1200,
        minWidth:1000,
        height: 800,
        minHeight:600,
        show: false, // change to 'true' for debugging, if simulator isn't starting
        webPreferences: {
            webSecurity: false
        },
        icon: path.join(__dirname, 'resources/icon/precious_diamant_256.png')
    });
    mainWindow.loadURL('file://' + __dirname + '/app/mainWindow.html');

    //handler for main window.close
    mainWindow.on("closed", function () {
        mainWindow = null;
        app.quit();
    });

    loadPages();

}


////////////////////////////////////////////
// ipc
///////////////////////////////////////////

///////////////////////////////////////////
// main Window
//////////////////////////////////////////
/**
 * fired upon main Window's jQuery.ready()
 */
ipc.on('main-window-ready',function() {
    loadingWindow.close();
    loadingWindow = null;
    mainWindow.show();
});

/**
 * fired upon Pressing "Start" Button in Generals Tab
 */
ipc.on("start-simulator", function(event, args) {
    if(simulatorWindow == null || openedPath !== args.path) {
        try {
            fs.accessSync(args.path,fs.R_OK);
        }catch (e) {
            event.sender.send("status-message", {type: "error", msg: "File not found."});
            return;
        }
        closeSimulator();
        openedPath = args.path;
        //app.addRecentDocument(args.path);
        var width = args.width;
        var height = args.height;
        simulatorWindow = new BrowserWindow({
            width: width,
            height: height,
            resizable: false,
            maximizable: false,
            useContentSize: true,
            title: "Precious Simulator",
            webPreferences: {
                preload: path.join(app.getAppPath(),'precious/precious-simulator.js'),
                nodeIntegration: false
            },
            icon: path.join(__dirname, 'resources/icon/precious_diamant_256.png')
        });

        //simulatorWindow.webContents.enableDeviceEmulation({screenPosition: 'mobile'});
        simulatorWindow.webContents.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4'); //TODO

        simulatorWindow.on('page-title-updated', (e) => e.preventDefault());
        simulatorWindow.on('closed', function() {
            simulatorWindow = null;
            if(mainWindow)
                mainWindow.webContents.send("simulator-closed");
        });

        simulatorWindow.setMenu(null);

        simulatorWindow.loadURL("file://" + args.path);
        simulatorWindow.webContents.on('did-finish-load', function() {

            mainWindow.webContents.send('simulator-started', {});
        });
    } else {
        simulatorWindow.show();
    }
});

ipc.on('close-simulator', closeSimulator);

/**
 * fired upon pressing "browse" Button in generals Tab
 * Shows open File Dialog
 */
ipc.on("open-file",function(event, args) {
    var id = args.id;
    delete args.id;
    if(typeof id === 'undefined')
        return;
    dialog.showOpenDialog(args,function(fnames) {
        event.sender.send("file-opened", {id:id, info:fnames});
    });
});


ipc.on("get-config", (event, args) => {
    const conf = require(path.join(__dirname,'app/modules/config'));
    var getVal = (args) => {
        var result = conf.get(args.key);
        return (result !== undefined) ? result : (args.default !== undefined ? args.default : false);
    };
    if(Array.isArray(args)) {
        var ret = {};
        for(var el of args) {
            ret[el.key.split(':').pop()] = getVal(el);
        }
        event.returnValue = ret;
    } else {
        event.returnValue = getVal(args)
    }
});
ipc.on("set-config", (event, args) => {
    const conf = require(path.join(__dirname,'app/modules/config'));
    conf.set(args.key, args.value);
    //conf.save();
});

ipc.on('precious-request-response', (event, args) => {
    if(simulatorWindow)
        simulatorWindow.webContents.send('precious-response', args);
});

ipc.on('precious-status-message', (event, args) => {
    if(simulatorWindow)
        simulatorWindow.webContents.send('precious-status', args);
});

ipc.on('app-action', (event, args) => {
    if(simulatorWindow === null)
        return;

    switch(args.action) {
        case "minimize":
            simulatorWindow.setTitle("Precious Simulator - minimized");
            break;
        case "maximize":
            simulatorWindow.setTitle("Precious Simulator");
            break;
        case "disablejs":
            /*simulatorWindow.webContents.debugger.attach('1.1');
            simulatorWindow.webContents.debugger.sendCommand('Page.setScriptExecutionDisabled', {value: true});
            simulatorWindow.webContents.debugger.detach();*/
            break;
        case "enablejs":
            break;
    }
});


/////////////////////////////////////////
// simulator Window
////////////////////////////////////////

ipc.on('precious-message', (event, args) => {
    console.log('Message received:');
    console.log(args);
    mainWindow.webContents.send('precious-request', args);
});

ipc.on('log', (event, args) => {
    console.log(args);
});


/////////////////////////////////////////
// helper functions
////////////////////////////////////////

function loadPages() {
    const config = require(path.join(__dirname,'app/modules/config'));
    var dirs = config.get('dirs');
    var pageDirs = dirs.length;
    var allPages = {};
    var pageDirsRead = 0;
    var sendPages = (type) =>  (pages) => {
        //mainWindow.webContents.send("pages-loaded", pages);
        if(pages)
            allPages[type] = pages;
        pageDirsRead++;
        if(pageDirsRead >= pageDirs) {
            if (mainWindow.webContents.isLoading()) {
                mainWindow.webContents.once('did-stop-loading', () => {
                    mainWindow.webContents.send("pages-loaded", allPages);
                });
            } else {
                mainWindow.webContents.send("pages-loaded", allPages);
            }
        }
    };
    for(var dir of dirs) {
        try {
            loadPluginFolder(path.join(app.getAppPath(),dir.dir), sendPages(dir.type));
        } catch (e) {
            sendPages(dir.type)([]); //send empty array of pages
        }
    }
    if(pageDirs === 0) {
        sendPages('')(); //call send pages handler, to continue loading main window without plugins
    }
}

/**
 * @callback pluginsLoaded
 * @param {[]} all valid pages
 */

/**
 * loads all pages/plugins in given directory
 * @param {String} dir directory in which pages are searched
 * @param {pluginsLoaded} callback is called upon success.
 */
function loadPluginFolder(dir, callback) {
    if(typeof callback !== 'function')
        throw new TypeError("callback must be of type function.");

    dir = path.normalize(path.resolve(dir));
    var loadedPages = [];
    var pagesNum = 0;
    var countLoadedPages = 0;
    var addPage = (page) => {
        if(page)
            loadedPages.push(page);
        countLoadedPages++;
        if(countLoadedPages >= pagesNum) {
            loadedPages.sort((a,b) => a.pName > b.pName);
            callback(loadedPages);
        }
    };
    if(fs.statSync(dir).isDirectory()) {
        var pages = fs.readdirSync(dir).filter((f)=>fs.statSync(path.join(dir,f)).isDirectory());
        pagesNum = pages.length;
        if(pagesNum === 0) addPage();
        for(var page of pages) {
            ((p) => {
                var pPath = path.join(dir, p);
                fs.readFile(path.join(pPath, "info.json"), (err, json) => {
                    if (err) {
                        addPage();
                    }
                    else {
                        var info;
                        try {
                            info = JSON.parse(json);
                        } catch (e) {
                            addPage();
                            return;
                        }
                        fs.readFile(path.join(pPath, info.url), (err, file) => {
                            if (err) {
                                addPage();
                            }
                            else {
                                var pageInfo = {};
                                pageInfo.info = info;
                                pageInfo.file = file;
                                pageInfo.dir = pPath;
                                pageInfo.pName = p;
                                addPage(pageInfo);
                            }
                        });
                    }
                });
            })(page);
        }
    } else {
        throw new URIError("No valid Path given.");
    }
}


function closeSimulator() {
    if(simulatorWindow) {
        openedPath = null;
        simulatorWindow.close();
    }
}
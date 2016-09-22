"use strict";

const ipc = require('electron').ipcRenderer;

class FileOpener {
    constructor() {
        this._requests = {};
        this._nextID = 1;
        ipc.on('file-opened', this._handleOpenedMessage.bind(this));
    }

    _handleOpenedMessage(event, args) {
        if(!args || !args.id)
            return;
        var cb = this._requests[args.id];
        delete this._requests[args.id];

        if(args.info)
            cb(args.info);
    }

    openFile(options, cb) {
        if(typeof cb !== 'function')
            throw TypeError('callback must be of type function');

        options = options || {properties: ["openFile"]};

        var id = this._nextID++;
        options.id = id;
        this._requests[id] = cb;
        ipc.send("open-file", options);
    }
}

module.exports = new FileOpener();
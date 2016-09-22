"use strict";

const ipc = require('electron').ipcRenderer;
const EventEmitter = require('events');
const requestTypes = require('./request-types');
const responseTypes = require('./response-types');

/**
 * Class which receives precious requests and status messages, parses them and distributes to plugins
 * @singleton
 */
class PreciousEvents extends EventEmitter {

    /**
     * constructs PreciousEvents
     *
     */
    constructor () {
        super();
        /** @type {?Object} nullable response object */
        this._requestOperationSucceeded = null;
        ipc.on('simulator-started', this.simulatorStarted.bind(this));
        ipc.on('simulator-closed', this.simulatorStopped.bind(this));
        ipc.on('precious-request', this.requestReceived.bind(this));
        this.setMaxListeners(0);
    }

    /**
     * sets return value for specified update/remove request
     * if not set by any plugin, it is assumed, that the request failed and an appropriate message is sent
     * @param {Object} response
     */
    requestOperationSucceeded(response) {
        this._requestOperationSucceeded = response;
    }

    /**
     * redistributes simulator start event
     */
    simulatorStarted() {
        this.emit('simulator-started');
    }

    /**
     * redistributes simulator stop event
     */
    simulatorStopped() {
        this.emit('simulator-closed');
    }

    /**
     * called upon receiving a request
     * extracts data, parses request to event string
     * distributes to plugins
     * sends error messages on update/remove requests, if no plugin reacted
     * @param {object} event event object of ipc tunnel
     * @param {Object} args raw precious request
     */
    requestReceived(event, args) {
        var data = args.data;
        var emitId;
        var requestFailResponse = null; //if set, but request operation did not succeed, send response
        this._requestOperationSucceeded = null;
        if(args.api === 'api') {
            if (data.requestType === requestTypes.RemoveRequest) {
                emitId = 'precious-request-remove';
                requestFailResponse = { //set fail response
                    status: responseTypes.error,
                    requestID: data.requestID,
                    userInfo: data.userInfo,
                    error: "request not found"
                };
            } else if (data.requestType === requestTypes.UpdateRequest) {
                emitId = 'precious-request-update';
                requestFailResponse = { //set fail response
                    status: responseTypes.error,
                    requestID: data.requestID,
                    userInfo: data.userInfo,
                    error: "request not found"
                };
                return;
            } else {
                var type = data.type || 'default';
                 emitId = 'precious-api-' + data.pluginID + '-' + type;
            }
        } else if(args.api === 'status') {
            emitId = 'precious-status-' + data.request;
        } else {
            return;
        }

        if(!this.emit(emitId, data) && !requestFailResponse) {
            requestFailResponse = {
                status: responseTypes.requestRejected,
                requestID: data.requestID,
                userInfo: data.userInfo,
                error: "no handler for requeset found"
            }
        }
        let response;
        if(response = this._requestOperationSucceeded || requestFailResponse) {
                ipc.send('precious-request-response', response);
        }
    }
}

module.exports = new PreciousEvents();
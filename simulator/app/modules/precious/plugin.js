"use strict";

const defaultOptions = {
    status: false,
    interval: 0
};

const requestTypes = require('./request-types');
const responseTypes = require('./response-types');
const ipc = require('electron').ipcRenderer;


class PreciousPlugin {
    /**
     * Constructs Precious plugin
     * @param {?String} plugin if null, no api calls can be received
     */
    constructor (plugin) {
        this._events = require('./events');
        this._requests = {};
        this._plugin = plugin;
        this._updateCBs = [];
        this._maxContHandler = {};
        this._contHandlers = {};

        /**
         * is calls upon simulator start
         */
        this._events.on('simulator-started', () => {
            
        });

        /**
         * called upon simulator closed
         * clears all timers and resets request array
         */
        this._events.on('simulator-closed', () => {
            for( var k of Object.keys(this._requests)) {
                if (this._requests[k].timer) {
                    clearInterval(this._requests[k].timer);
                }
            }
            this._requests = {};
            this._contHandlers =  {};
        });

        /**
         * handles request remove
         */
        this._events.on('precious-request-remove', (args) => {
            if(this._requests[args.id] !== undefined) {
                var request = this._requests[args.id];
                delete this._requests[args.id];
                if(request.timer) {
                    clearInterval(request.timer);
                }
                var type = request.type;
                if (type === undefined || type === "")
                    type = 'default';

                if(this._contHandlers[type] !== undefined && this._contHandlers[type] > 0) {
                    --this._contHandlers[type];
                }
                var response = this._createRawResponseObject(args);
                response.message = "request removed";
                this._events.requestOperationSucceeded(response);
            }
        });

        /**
         * handles request update
         * calls update handlers
         */
        this._events.on('precious-request-update', (args) => {
            if(this._requests[args.id] !== undefined) {
                for (var cb of this._updateCBs) {
                    try {
                        cb(this._requests[args.id].args, args.params);
                    } catch (ignore) {
                    }
                }
                for(let key of args.params.keys())
                {
                    this._requests[args.id].args[key] = args.params[key];
                }
                var response = this._createRawResponseObject(args);
                response.message = "Parameters updated";
                this._events.requestOperationSucceeded(response);
            }
        });
    }

    /**
     * @callback requestHandler
     * @param {Object} request arguments
     * @param {Object} empty response object
     * @returns {Object} response object
     */

    /**
     * on(type [, options], callback)
     * @param {string} type
     * @param {?Object} options
     * @param {requestHandler} cb handler for api call
     */
    on(type, options, cb) {
        if(typeof options === 'function') {
            cb = options;
            options = defaultOptions;
        } else {
            for(var key of Object.keys(defaultOptions)) {
                if(typeof options[key] === 'undefined')
                    options[key] = defaultOptions[key];
            }
        }
        if((!this._plugin || this._plugin === '') && !options.status)
            throw new ReferenceError('For API listener plugin must be specified');

        if(!options.status && options.maxContinuousHandlers !== undefined) {
            this._maxContHandler[type] = options.maxContinuousHandlers;
        }

        var eventId = 'precious-' + (options.status ? 'status' : ('api-' + this._plugin)) + '-' + type;
        this._events.on(eventId, (args) => {
            var callCB = (request) => {
                try {
                    return this._pipeResponse(cb(request, this._createRawResponseObject(request)));
                }catch (e){
                    var msg = e.message || "unknown error";
                    var errorObj = this._createRawErrorObject(request);
                    errorObj.error = msg;
                    return this._pipeResponse(errorObj);
                }
            };

            if(!options.status && args.requestType == requestTypes.ContinuousGet) {
                if(this._contHandlers[type] === undefined)
                    this._contHandlers[type] = 0;

                if(this._maxContHandler[type] !== undefined && this._maxContHandler[type] <= this._contHandlers[type]) {
                    var response = this._createRawResponseObject(args);
                    response.status = responseTypes.requestRejected;
                    response.error = "No more continuous requests allowed.";
                    return this._pipeResponse(response);
                }

                ++this._contHandlers[type];

                var timer = null;
                if (options.interval) {
                    timer = setInterval(() => {
                        callCB(this._requests[args.requestID].args);
                    }, options.interval);
                }
                this._requests[args.requestID] = {args: args, cb: cb, timer: timer};
            }
            if (options.status)
                return this.sendStatus(cb(args));

            callCB(args);

        });
    }

    /**
     * @param {Object} oldRequest
     * @param {Object} newParameters
     * @callback updateCallback
     */

    /**
     * is called on update of any request
     * has no influence over update process
     * order in which handlers are registered is preserved
     * @param {updateCallback} cb
     */
    onUpdate(cb) {
        if(typeof cb !== 'function')
            throw new TypeError('Callback must be of type function');
        
        this._updateCBs.push(cb);
    }

    /**
     * sends a status object to the simulator
     * @param {Object} args Status Object 
     */
    sendStatus(args) {
        if(args) {
            ipc.send('precious-status-message', args);
        }
    }

    /**
     * calls callback handler for all continuous requests
     * all given parameters are passed to the callback function, but first parameter is always request arguments and last parameter is raw response object
     */
    pipe() {
        for(var r of this._requests) {
            arguments.unshift(r.args);
            arguments.push(this._createRawResponseObject(r.args));
            this._pipeResponse(r.cb.apply(this,arguments));
        }
    }

    /**
     * sends response to simulator window
     * @private
     * @param {Object} response
     */
    _pipeResponse(response) {
        if(response === undefined)
            return;
        ipc.send('precious-request-response', response);
    }

    /**
     * creates an empty response object
     * @param {Object} request
     * @returns {{status: number, requestID: string, userInfo: *}}
     * @private
     */
    _createRawResponseObject(request) {
        return {
            status: responseTypes.success,
            requestID: request.requestID,
            userInfo: request.userInfo
        };
    }

    /**
     * creates an empty error response object
     * @param {Object} request
     * @returns {{status: number, requestID: string, userInfo: *}}
     * @private
     */
    _createRawErrorObject(request) {
        var resp = this._createRawResponseObject(request);
        resp.status = responseTypes.error;
        return resp;
    }
}

module.exports = PreciousPlugin;
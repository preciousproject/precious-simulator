/*
relay for web socket requests

intended as use for 'man in the middle' attack on traffic between simulator window debugger and inspector in main window
so that commands can be sent to the debugger additional to normal debugging mode
 */
const io = require('socket.io');
const http = require('http');

class WebsocketRelay {
    constructor (port, clientURI, maxConnections) {
        this.maxConnecions = maxConnections !== undefined ? maxConnections: 1;
        this._clientURI = clientURI;
        this._port = port;
        this._openConnections = 0;
        this._httpServer = http.createServer(this.httpRequest.bind(this));
        this._httpServer.listen(port);
        this._server = io(this._httpServer, {});
        this._server.set('authorization', this.authorize.bind(this));
        this._server.on('connection', this.connected.bind(this));
        this._client = null;
        this._connectionSrc = [];
    }

    authorize(handshake, accept) {
        if (this._openConnections >= this.maxConnecions || this._client !== null) {
            accept(null, false);
            return;
        }
        this._openConnections++;
        accept(null, true);
    }

    connected (socket) {
        this._connectionSrc.push(socket.handshake.address);
        socket.on('disconnect', () => {
            this._openConnections--;
            this._connectionSrc = this._connectionSrc.filter(e => e !== socket.handshake.address);
        });
    }

    httpRequest(request, response) {
        console.log("got http request");
        console.log(request);
        console.log(response);
    }

    message() {

    }
    
}

module.exports = WebsocketRelay;

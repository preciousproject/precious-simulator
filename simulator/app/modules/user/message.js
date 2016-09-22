"use strict";


var alertTime = 3000;

var setAlertTime = module.exports.setAlertTime = (time)=> {
    if(Number.isInteger(time)) {
        alertTime = time;
    }
};

var getAlertTime = module.exports.getAlertTime = () => alertTime;

var show = module.exports.show = (args) => {
    var type = "warning";
    var header = "Warning!";
    var persistent = args.persistent || false;
    var time = args.time || alertTime;
    switch(args.type) {
        case "error":
            type = "danger";
            header = "Error!";
            break;
        case 'info':
            type = 'info';
            header = 'Info!';
            break;
        case 'success':
            type = 'success';
            header = '';
    }

    header = args.header !== undefined ? args.header : header;

    var box = '<div class="alert alert-' + type + ' alert-dismissible" role="alert">'+
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        (header !== '' ? '<strong>' + header + '</strong>&nbsp;' : '') + args.msg + '</div>';
    $('#messageArea .' + (persistent ? '' : 'non-') + 'persistent').prepend(box);
    if(!persistent) {
        var mbox = $('#messageArea .non-persistent .alert:first');
        setTimeout(function (box) {
            box.fadeTo("slow", 0, function () {
                box.remove();
            });
        }, alertTime, mbox);
    }
};
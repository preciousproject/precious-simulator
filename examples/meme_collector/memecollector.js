"use strict";
var gps = null;

$(function() {
    $('#resetBtn').click(function() {
        var containers = $('.meme-container');
        containers.find('.meme').addClass('undiscovered');
        containers.find('span.current').show().text('0').data('distance', 0);
        containers.find('span.description').show();
        containers.find('img').addClass('invisible');
        containers.each(function() {
            Precious.plugins.setStorageEntry(null, $(this).data('description'), 0);
        });

    });

    $('.meme-container').each(function() {
        var container = $(this);
        var description = container.data('description');
        container.find('.description').html(' of ' + container.data('needed') + 'm<br><span class="type">' +  container.data('type') + '</span>');
        var handler = function (error, response) {
            var value = response.value || 0;
            var currentElement = container.find('.current');
            currentElement.data('distance', value);
            if(value >= container.data('needed')) {
                container.find('.meme').removeClass('undiscovered');
                container.find('img').removeClass('invisible');
                container.find('.description').hide();
                container.find('.name').text(description);
                currentElement.hide();
            } else {
                currentElement.text(Math.round(value));
            }
        };
        Precious.plugins.getStorageEntry(handler,description);

    });
    Precious.plugins.getContinuousGPS(handleGpsResponse);
});

function handleGpsResponse(gpserror, gpsresponse) {
    if(gpserror) {
        $('#gps-available').find('span').removeClass('label-success').addClass('label-danger').text('No GPS Signal');
        return;
    }

    $('#gps-available').find('span').addClass('label-success').removeClass('label-danger').text('GPS available');
    var lastGps = gps;
    gps = gpsresponse;

    if(lastGps === null)
        return;

    Precious.plugins.getActivity(function(acterror, actresponse) {
        if(acterror)
            return;

        var containers = $('.meme-container');
        var count = 0;
        var counted = {};
        var distance = calcDist(lastGps, gpsresponse);
        containers.each(function () {
            var type = $(this).data('type');
            if(actresponse[type] === true && !counted[type]) {
                count++;
                counted[type] = true;
            }
        });
        containers.each(function() {
            if(actresponse[$(this).data('type')] === true) {
                var container = $(this);
                var currentElement = container.find('.current');
                var current = Number.parseFloat(currentElement.data('distance')) || 0;
                var needed = container.data('needed');
                var description = container.data('description');
                if(current >= needed)
                    return;

                current = current + distance / count;
                currentElement.data('distance', current);
                if(current >= needed) {
                    container.find('.meme').removeClass('undiscovered');
                    container.find('img').removeClass('invisible');
                    container.find('.description').hide();
                    container.find('.name').text(description);
                    currentElement.hide();
                } else {
                    currentElement.text(Math.round(current));
                }

                Precious.plugins.setStorageEntry(null,description,current);
            }
        });
    });
}

function calcDist(gps1, gps2) {
    var R = 6371e3; // metres
    var rad_lat1 = gps1.latitude.toRadians();
    var rad_lat2 = gps2.latitude.toRadians();
    var rad_diff_lat = (gps2.latitude-gps1.latitude).toRadians();
    var rad_diff_lon = (gps2.longitude-gps1.longitude).toRadians();

    var a = Math.sin(rad_diff_lat/2) * Math.sin(rad_diff_lat/2) +
        Math.cos(rad_lat1) * Math.cos(rad_lat2) *
        Math.sin(rad_diff_lon/2) * Math.sin(rad_diff_lon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
    return d;
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRadians) === "undefined") {
    Number.prototype.toRadians = function() {
        return this * Math.PI / 180;
    }
}
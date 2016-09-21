var currentHeartrate = -1;
var myIntervall;
var intervallTime = 1000; // intervall in milliseconds

var pointtofly = 0;
var distance = 40;
var stop = false;
var height = 0;
var currentval = -200;
var points = 0;

$(function(){
    init();
    // document.onkeydown = checkKey;
});

/*        function checkKey(e) {
 e = e || window.event;
 if (e.keyCode == '38') {
 // up arrow
 mariomove(50);
 }
 else if (e.keyCode == '40') {
 // down arrow
 mariomove(-50);
 }
 else if (e.keyCode == '37') {
 // left arrow
 }
 else if (e.keyCode == '39') {
 // right arrow
 }
 }*/

function intervallFunction() {
    getHeartrate();
}

function getHandler() {
    return function (error, response) {
        if (error) {
            currentHeartrate = -1;
            $("#heartrate").html("&#x2764; " + "?");

        } else {
            currentHeartrate = Math.round(response['heartrate']);
            $("#heartrate").html("&#x2764; " + currentHeartrate);
            console.log("heartrate: " + currentHeartrate);
        }
    }
}

function getHeartrate() {
    Precious.makeRequest(
        Precious._validRequestTypes.SingleGet,
        "JS",
        "heartrate",
        {type: "default"}, //needs to be handled correctly by precious
        getHandler()
    );
}

function checkHeartrate(){
    if(currentHeartrate !== -1){
        $("#buttons").hide();
        return true;
    } else {
        $("#info").show();
        return false;
    }
}

function init(){
    $("#mario").animate({top: -currentval, bottom: currentval}, 0, "linear", function(){});
    $("#points").hide();

    myIntervall = setInterval(intervallFunction, intervallTime);
    intervallFunction();
}

function startgame(){
    $("#end").hide();

    if(checkHeartrate() === true){

        stop = false;
        height = 0;
        currentval = -200;
        points = 0;

        start();
    }
}

function start(){
    mariomove(200, 2000);

    pointtofly = pointtofly - distance;
    $("#background").animate({backgroundPositionX : pointtofly}, 2000, "linear", function() {
        $("#points").show();
        mainLoop();
    });
}

function stopgame(){
    stop = true;

    points = Math.round(points);
    $("#info").hide();
    $("#end").html("Du hast " + points + " Coins erreicht!");
    $("#end").show();
    $("#points").hide();
    $("#buttons").show();
}

function userpoints(){
    points = points + (height / (20*6));
    $("#points").html(Math.round(points) + " Coins");
}

function muchMuchToMove(){
    var hr = currentHeartrate;
    var value = 200;

    if(hr > 40 && hr <= 65){
        value = 400;
    }
    else if(hr > 65 && hr <= 70) {
        value = 350;
    }
    else if(hr > 70 && hr <= 75) {
        value = 300;
    }
    else if(hr > 75 && hr <= 80) {
        value = 250;
    }
    else if(hr > 80 && hr <= 85) {
        value = 200;
    }
    else if(hr > 85 && hr <= 90) {
        value = 150;
    }
    else if(hr > 90 && hr <= 100) {
        value = 100;
    }
    else if(hr > 100 && hr <= 120) {
        value = 50;
    }
    else {
        value = 0;
    }

    return -(height - value);
}

function mainLoop(){
    userpoints();
    pointtofly = pointtofly - distance;

    mariomove(muchMuchToMove());

    $("#background").animate({backgroundPositionX : pointtofly}, 500, "linear", function() {
        if(stop === false){
            mainLoop();
        }
    });
}

function mariomove(val){
    mariomove(val, 500);
}

function mariomove(val, t){
    if(stop === true) return;

    var oldHeight = height;
    height = height + val;

    if(height <= 0){
        height = 0;
        val = -oldHeight;
        stopgame();
    }
    else if(height >= 400){
        height = 400;
        val = 400 - oldHeight;
    }

    currentval = currentval + val;

    $("#mario").animate({top: -currentval, bottom: currentval}, t, "linear", function() {

    });
}
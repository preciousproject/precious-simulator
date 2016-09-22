function startLocationRequests(callback) {
	Precious.plugins.getContinuousGPS(function(error, response) {
        	if(error) callback(error);
        	else {
        		callback(null, {
        			latitude: response.latitude,
        			longitude: response.longitude
        		});
        	}
    });
}

function setGpsAvailable(available) {
	var isVisible = $("#overlay").is(":visible"); 
	if (available) {
		if (isVisible) {
			$('#overlay').fadeOut();
		}
	} else {
		if (!isVisible) {
			$('#overlay').fadeIn();
		}
	}
}

function getDistanceFromLatLonInMeters(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  // deg2rad below
	var dLon = deg2rad(lon2-lon1); 
	var a = 
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function initMemeMarkers(positions, map) {

	var markers = [];

	positions.forEach(function(el) {
		
		var icon = {
	        url: el.meme.path,
	        scaledSize: new google.maps.Size(25, 25),
	        anchor: new google.maps.Point(12.5, 12.5)
	    };

		var marker = new google.maps.Marker({
			position: { lat: el.pos.lat, lng: el.pos.lon},
			map: map,
			icon: icon,
			zIndex: 0,
		});

		markers.push({
			meme: el.meme,
			marker: marker,
			pos: { lat: el.pos.lat, lon: el.pos.lon}
		});
	
	});

	return markers;
}

function getCollidingMarkersAndRemoveCollisions(memeMarkers, currentPosition, maxDistance) {

	var foundMarkers = [];

	for(var i=memeMarkers.length-1; i>=0; i--) {
			var currentMarker = memeMarkers[i];
			if (getDistanceFromLatLonInMeters(currentMarker.pos.lat, currentMarker.pos.lon, currentPosition.lat(), currentPosition.lng()) <= maxDistance) {
				foundMarkers.push(currentMarker);
				memeMarkers.splice(i, 1);
			}
	}

	return foundMarkers;
}

function collisionDetected(counter, collision) {

	// remove marker
	collision.marker.setMap(null);

	// clone the html element
	var newOverlay = $("#memeoverlay").clone();

	// get the meme
	var meme = collision.meme;
	var name = meme.name;

	newOverlay.find('img').attr("src", meme.path);
	newOverlay.find('.top').html(name);
	newOverlay.find('.bottom').html("You have now collected " + counter + " items!");

	// add to body
	newOverlay.appendTo("body");

	newOverlay.css({"transform":"translateY(0%)"});

	setTimeout(function() { 
		newOverlay.css({"transform":"translateY(100%)"}); 
		setTimeout(function() {
			newOverlay.remove();
		}, 1300)
	}, 3000);

}





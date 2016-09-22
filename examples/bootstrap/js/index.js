function start() {
	Precious.plugins.getUserID(function(error, response) {
		var userId;
		if (error != null) {
			userId = error.msg;
		} else {
			userId = response.id;
		}
		$('#userID').html(userId);
	});
}

// #ALERT BUTTON
var alertBtn = document.getElementById("alertBtn");

alertBtn.onclick = function() {
	SendAlertEmail();
}

function SendAlertEmail() {
	var formattedBody = "test body";
	var subject = "test subject";
	var recipientEmails = "zacengland2@gmail.com,testemail@gmail.com";
	var mailToLink = "mailto:" + recipientEmails + "?subject="
		+ encodeURIComponent(subject) + "&body=" + encodeURIComponent(formattedBody);
	location.href = mailToLink;
}

// #END ALERT BUTTON

// #DETAILS BUTTON

var detailsBtn = document.getElementById("detailsBtn");

detailsBtn.onclick = function() {
	PopulateDetails();
}

function PopulateDetails() {
	var latitude = "test";
	var longitude = "test";
	var buildings = "b1, b2, b3, ...";
	document.getElementById('details').innerHTML = 
		"Details: <br>" +
		"Latitude: " + latitude + "<br>" +
		"Longitude: " + longitude + "<br>" +
		"Buildings: " + buildings;
}

// #END DETAILS BUTTON

// #OBJECT DETECTION MODAL

var modal = document.getElementById("ObjDetModal");
var btn = document.getElementById("modalBtn");
var declineBtn = document.getElementById("ObjDetDecline");
var acceptBtn = document.getElementById("ObjDetAccept");
var span = document.getElementsByClassName("close")[0];
var timeLeft;
var objDetTimer;

// When the user clicks on the button, open the modal
// TODO: Turn this into a function that can be called by "tensorflow" instead of an event
btn.onclick = function() {
	modal.style.display = "block";
	timeLeft = 10;
	document.getElementById("ObjDetTimer").innerHTML = timeLeft;
	objDetTimer = setInterval(function() {
		if (timeLeft == 0) AcceptDetection();
		timeLeft--;
		document.getElementById("ObjDetTimer").innerHTML = timeLeft;
	}, 1000);
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
	modal.style.display = "none";
	clearInterval(objDetTimer);
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = "none";
		clearInterval(objDetTimer);
	}
}

declineBtn.onclick = function() {
	DeclineDetection();
}

function DeclineDetection() {
	modal.style.display = "none";
	clearInterval(objDetTimer);
	// TODO: Add any other function(s) that need to be called here
	// Disable attention getting features function
}

acceptBtn.onclick = function() {
	AcceptDetection();
}

function AcceptDetection() {
	modal.style.display = "none";
	clearInterval(objDetTimer);
	// TODO: Add any other function(s) that need to be called here
	// Disable attention getting features function
	// Save appropriate details {iLat, iLong, image of video feed, ...}
	// Dynamic Google Maps update function call(s)
	// Static Google Maps update function calls(s)
}

// #END OBJECT DETECTION MODAL
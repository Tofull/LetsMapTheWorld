// Acces DOM
var divNombreClients = document.getElementById("nombreClients"); 

// Initialisation des tuiles
var map = L.map('map').setView([48.85,2.35], 10);

L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
{
    maxZoom: 18,
    subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);


// Variable de géopositionnement
var latitude=0;
var longitude=0;
var me = L.marker([latitude, longitude]).addTo(map);

// Stockage des positions des autres clients
var markersObject = {};


// Connexion au serveur
var socket = io.connect('wss://letsmaptheworld.herokuapp.com/');

// Un nouveau client vient de se connecter au serveur
socket.on('new_client', function(data) {
	//console.log(data.socketid + " is now connected");
	
	var objetPosition = new Object();
		objetPosition['latitude'] = latitude;
		objetPosition['longitude'] = longitude;
	var objetAEnvoyer = JSON.stringify(objetPosition);
	
	// On se presente a ce client en lui envoyant notre position
	socket.emit('present_to_new_client', {socketid : data.socketid, pos : objetAEnvoyer});
	delete objetPosition;
});


// Réception des données d'un autre client
socket.on('coordonneesBroadcast', function(data) {
	//console.log(data.socketid + " se présente. Il nous envoie sa position : "+ data.pos);
	data.pos = JSON.parse(data.pos);
	
	// Creation du marqueur en memoire
	if (typeof(markersObject[data.socketid]) == "undefined" )
	{
		markersObject[data.socketid] = new L.marker([0, 0]);
		markersObject[data.socketid].addTo(map);
	}

	// On déplace le marqueur sur la position de l'autre client
	markersObject[data.socketid].setLatLng([data.pos.latitude, data.pos.longitude]);

})


// Un client perd la connexion
socket.on('clientLeft', function(data) {            	
	//console.log(data.socketid + " vient de partir");
	// Suppression du marqueur de la carte
	if (typeof(markersObject[data.socketid]) != "undefined" )
	{
		map.removeLayer(markersObject[data.socketid]);
	}

	// Suppresion du marqueur en mémoire
	delete markersObject[data.socketid];
})


// Nombre de clients connectés au serveur
socket.on('count', function(data) {
	//console.log(data.nombreClients + " clients présents");
	if (data.nombreClients <= 1 )
	{
		divNombreClients.innerHTML = data.nombreClients + " connected client";
	}
	else
	{
		divNombreClients.innerHTML = data.nombreClients + " connected clients";
	}
})


// Recuperation des coordonnees
navigator.geolocation.watchPosition(
	function(pos) {
		// Mise a jour des variables
		latitude=pos.coords.latitude; 
		longitude=pos.coords.longitude;

		// Centrage de la map
		// map.setView([latitude, longitude]);
		
		// Creation du marqueur
		me.setLatLng([latitude, longitude]);


		var objetPosition = new Object();
			objetPosition['latitude'] = latitude;
			objetPosition['longitude'] = longitude;
		var objetAEnvoyer = JSON.stringify(objetPosition);

		socket.emit('coordonneesClient', {pos : objetAEnvoyer});
		delete objetPosition;
	}, 
	function(err) {
		console.warn('ERROR(' + err.code + '): ' + err.message);
	}, 
	{	enableHighAccuracy: true,
		maximumAge: 0
	}
);



/*
// Simulation de deplacement de la position
function replay(){
	latitude=Math.floor((Math.random() * 45) + 1); 
	longitude=Math.floor((Math.random() * 45) + 1);
	me.setLatLng([latitude, longitude]);
	
	var objetPosition = new Object();
		objetPosition['latitude'] = latitude;
		objetPosition['longitude'] = longitude;
	var objetAEnvoyer = JSON.stringify(objetPosition);

	socket.emit('coordonneesClient', {pos : objetAEnvoyer});
	
	window.setTimeout(
		function(){
			replay();
		},
		1000);
}
replay();
*/
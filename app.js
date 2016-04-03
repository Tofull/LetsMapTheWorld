// Copyright 
// Auteur : Loic Messal < loic.messal@ensg.eu >
// Veuillez citer l'auteur lors d'une réutilisation de ce code svp
// Let's map the world

// Chargement des modules node
var http = require('http');
var fs = require('fs');


 


// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

server.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", server_port " + port );
});

// Chargement de socket.io
var io = require('socket.io').listen(server);


// Gestion des sockets
io.sockets.on('connection', function (socket, pseudo) {

    // console.log(socket.id + " is now connected ! ");    

    // Envoi à tous les clients qu'un nouveau client vient de se connecter au serveur
    socket.broadcast.emit('new_client', {socketid : socket.id});

    // Envoi à tous les clients du nombre de clients connectés
    io.sockets.emit('count', {nombreClients : io.engine.clientsCount});

    // Envoi au nouveau client les informations des clients connectés avant sa connexion
    socket.on('present_to_new_client', function(data) {
        //console.log(socket.id + " se presente à " + data.socketid);
        io.sockets.connected[data.socketid].emit('coordonneesBroadcast', {socketid: socket.id, pos: data.pos});
    });

    // Diffusion d'un changement de position à tous les clients 
    socket.on('coordonneesClient', function(data) {
        socket.broadcast.emit('coordonneesBroadcast', {socketid: socket.id, pos: data.pos});
    });

    // Lors d'une deconnexion
    socket.once('disconnect', function () {
        // Envoi à tous les clients du nombre de clients connectés
        socket.broadcast.emit('count', {
            nombreClients : io.engine.clientsCount
        });
        // Envoi de l'identifiant du client qui vient de se deconnecter pour l'effacer de la carte 
        socket.broadcast.emit('clientLeft', {socketid:socket.id });
    });  
});




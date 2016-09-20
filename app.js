// Copyright 
// Auteur : Loic Messal < loic.messal@ensg.eu >
// Veuillez citer l'auteur lors d'une réutilisation de ce code svp
// Let's map the world

// Chargement des modules node
var http = require('http');
var fs = require('fs');


 


// Chargement du fichier index.html affiché au client
var server = http.createServer(function(request, response) {
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});

var server_port = process.env.PORT || 8080 ; 


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



server.listen(server_port);
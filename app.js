var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socket_io    = require( "socket.io" );

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// Socket.io
var io           = socket_io();
app.io           = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});




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


module.exports = app;

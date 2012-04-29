//var app = require('http').createServer(handler);
var app = require('express').createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');

app.listen(8083);

var players = [];

function addPlayer(id) {
  console.log('Adding player');
  if (players.length >= 2) {
    return false;
  } else {
    var num = getPlayerNumber();
    players.push({ 
      id: id, 
      playerNum : num,
      coordinates : { x: 0, y: 0 }
    });
    return num;
  }
}

function removePlayer(id) {
  console.log('Removing player');
  for (var i in players) {
    if (players[i].id == id) {
      delete players.splice(i,1);
      return;
    }
  }
}

function getPlayerNumber() {
  if (players.length === 0) return 1;
  else {
    var p = players[0];
    if (p.playerNum == 2) 
      return 1;
    else 
      return 2;
  }
}

function getPlayer(id) {
  for (var i in players) {
    if (players[i].id == id) {
      return players[i];
    }
  }
  return false;
}

function setCoordinates(id, coordinates) {
  for (var i in players) {
    if (players[i].id == id) {
      players[i].coordinates = coordinates;
      return players[i];
    }
  }
  return false;
}

//app.get('/',function(req, resp){
//  resp.sendfile(__dirname + '/index.html');
//});

io.sockets.on('connection', function (socket) {
  console.log(socket.store.store);
  var playerNum = addPlayer(socket.id);
  if (playerNum !== false) 
  {
    socket.emit('msg', 'Welcome player '+playerNum);
    socket.emit('msg', { type: 'setPlayer', num: playerNum });
    
    socket.on('error', function(err){
      console.log(err);
    });
    
    socket.on('move', function (coordinates) 
    {
      var player = setCoordinates(socket.id, coordinates);
      if (player) {
        socket.broadcast.emit('msg', { type: 'move', player: player });  
      } else {
        console.log('Could not find player.');
      }
    });
    
    socket.on('disconnect', function () 
    {
      console.log('Player disconnected');
      removePlayer(socket.id);
      io.sockets.emit('user '+socket.id+'disconnected');
    });
  } 
  else 
  {
    socket.emit('msg', 'Two many players, two are already connected.');
    socket.disconnect();
  }
});

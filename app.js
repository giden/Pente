/* jshint node: true */
var app = require("express")();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);

var static = require('serve-static');
var port = process.env.PORT || 3000;

var oneDay = 86400000;

app.use('/img', static(__dirname + '/public/img', {
    maxAge: oneDay
}));
app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use(static(__dirname + '/public'));

var usernames = [];

var rooms = ['Lobby'];
var listaGier = [];
var history = [];
var przechowalnia = [];
var users = [];
var blockGame = [];
var punkt = [];

function userExists(name) {
    return users.some(function(el, idx) {
        return el == name;
    });
}



io.sockets.on('connection', function(socket) {
    var bicie = false;
    var iterator = 0;
    var usun = false;
    var punkt = 0;
    socket.on('login', function(username) {
        if (!userExists(username)) {
            socket.username = username;
            socket.room = 'Lobby';
            usernames[username] = username;
            
            users = [];
            for (var element in usernames) {
            users.push(element);
        }
            
            socket.join('Lobby');
            socket.emit('updateChat', 'INFO', 'dołączyłeś do Lobby');
            socket.broadcast.to('Lobby').emit('updateChat', 'SERWER', username + ' dołączył do Lobby');
            socket.emit('updateRooms', rooms, 'Lobby');
            history[socket.room] = [];
            io.sockets.in(socket.room).emit('usersLobby', users);

        } else {
            socket.emit("updateChat", "INFO", "Nick zajety");

            socket.disconnect();
        }
    });

    socket.on('create', function(room) {
        if (rooms.length < 10) {
            rooms.push(room);
            przechowalnia[room] = "Cross";
            listaGier.push({
                key: room,
                circle: null,
                cross: null
            });
            io.sockets.emit('updateRooms', rooms, socket.room);
        } else socket.emit('updateChat', 'INFO', 'Przekroczony limit pokojów');

    });

    socket.on('sendChat', function(data) {
        io.sockets.in(socket.room).emit('updateChat', socket.username, data);
    });

    var idExists = function idExists(id) {
        return history[socket.room].some(function(el, idx) {
            return el.pos == id;
        });
    };

    var canI = function canI(shape) {
        return shape != przechowalnia[socket.room];

    };

    var check = function check(id, shape, kierunek, beat) {

        if (!blockGame[socket.room]) {
            var shape2;
            if (shape == "Circle") shape2 = "Cross";
            if (shape == "Cross") shape2 = "Circle";

            var arrayId = id.split('-').map(Number);
            if (kierunek == "BR") {
                arrayId[0] += 1;
                arrayId[1] += 1;
            }
            if (kierunek == "B") {
                arrayId[0] += 1;
            }
            if (kierunek == "BL") {
                arrayId[0] += 1;
                arrayId[1] -= 1;
            }
            if (kierunek == "L") {
                arrayId[1] -= 1;
            }
            if (kierunek == "TL") {
                arrayId[0] -= 1;
                arrayId[1] -= 1;
            }
            if (kierunek == "T") {
                arrayId[0] -= 1;
            }
            if (kierunek == "TR") {
                arrayId[0] -= 1;
                arrayId[1] += 1;
            }
            if (kierunek == "R") {
                arrayId[1] += 1;
            }
            var id_next = arrayId.join("-");
            iterator += 1;

            if (beat) {
                history[socket.room].forEach(function(obj) {
                    if (obj.shape == shape2 && obj.pos == id_next && (iterator == 1 || iterator == 2)) {
                        if (iterator == 2) bicie = true;
                        check(id_next, shape, kierunek, true);
                        bicie = false;
                        if (iterator == 3 && usun) {
                            punkt[socket.room] += 1;
                            io.sockets.in(socket.room).emit('clean');
                            history[socket.room] = history[socket.room].filter(function(el) {
                                return el.pos !== id_next;
                            });
                        }
                        return;
                    } else if (obj.shape == shape && obj.pos == id_next && iterator == 3 && bicie) {
                        io.sockets.in(socket.room).emit('updateChat', "GRA", "punkt dla " + socket.username);
                        punkt += 1;
                        if (punkt == 10) {
                            io.sockets.in(socket.room).emit('wynik', "wygrał " + socket.username);
                            blockGame[socket.room] = true;
                        }

                        usun = true;

                        return;
                    }
                });
            } else {


                history[socket.room].forEach(function(obj) {
                    if (obj.shape == shape && obj.pos == id_next) {
                        check(id_next, shape, kierunek);

                    }
                });


                if (iterator == 5) {
                    io.sockets.in(socket.room).emit('wynik', 'wygrał <span style="color: red">' + socket.username + '</span>');
                    io.sockets.in(socket.room).emit('wygrana', id);
                    blockGame[socket.room] = true;
                }
            }
        }
    };

    socket.on('addShape', function(id) {
        if (socket.shape && !idExists(id) && canI(socket.shape) && !blockGame[socket.room]) {
            history[socket.room].push({
                shape: socket.shape,
                pos: id
            });
            history[socket.room].forEach(function(obj) {
                iterator = 0;
                check(obj.pos, obj.shape, "BR");
                iterator = 0;
                check(obj.pos, obj.shape, "B");
                iterator = 0;
                check(obj.pos, obj.shape, "BL");
                iterator = 0;
                check(obj.pos, obj.shape, "L");
                iterator = 0;
                check(obj.pos, obj.shape, "TL");
                iterator = 0;
                check(obj.pos, obj.shape, "T");
                iterator = 0;
                check(obj.pos, obj.shape, "TR");
                iterator = 0;
                check(obj.pos, obj.shape, "R");
            });
            iterator = 0;
            usun = false;
            check(id, socket.shape, "BR", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "B", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "BL", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "L", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "TL", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "T", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "TR", true);
            iterator = 0;
            usun = false;
            check(id, socket.shape, "R", true);

            var tmp = przechowalnia[socket.room];
            przechowalnia[socket.room] = socket.shape;
            io.sockets.in(socket.room).emit('turn', tmp);
            socket.emit('wait', "czekaj");

        }
        io.sockets.in(socket.room).emit('draw', history[socket.room]);

    });

    socket.on('switchRoom', function(newroom) {

        var oldroom, i;
        oldroom = socket.room;
        socket.leave(socket.room);
        for (i = 0; i < listaGier.length; i++) {
            if (listaGier[i].key == oldroom) {
                if (listaGier[i].circle == socket.username) {
                    listaGier[i].circle = null;
                    socket.shape = null;
                    cleaning(oldroom);

                } else if (listaGier[i].cross == socket.username) {
                    listaGier[i].cross = null;
                    socket.shape = null;
                    cleaning(oldroom);

                } else socket.shape = null;
            }
        }
        socket.join(newroom);
        socket.emit('updateChat', 'INFO', 'wszedłeś do ' + newroom);
        socket.broadcast.to(oldroom).emit('updateChat', 'SERWER', socket.username + ' opuścił pokój');
        socket.room = newroom;
        io.sockets.in(socket.room).emit('draw', history[socket.room]);
        socket.broadcast.to(newroom).emit('updateChat', 'SERWER', socket.username + ' dołączył do pokoju');
        socket.emit('updateRooms', rooms, newroom);

        listaGier.forEach(function(obj) {
            if (obj.key == newroom) {
                if (!obj.circle) {
                    obj.circle = socket.username;
                    socket.shape = "Circle";
                } else if (!obj.cross) {
                    obj.cross = socket.username;
                    socket.shape = "Cross";
                    przechowalnia[socket.room] = "Cross";
                } else socket.shape = null;
                io.sockets.in(socket.room).emit('selectUsers', obj.circle, obj.cross);

            }
        });
        if (socket.shape) {
            history[socket.room] = [];
            io.sockets.in(socket.room).emit('clean');
            io.sockets.in(socket.room).emit('turn', "Circle");

        }
        if (newroom == "Lobby") {
            io.sockets.in(socket.room).emit('clean');
            io.sockets.in(socket.room).emit('usersLobby', users);

        }

        socket.emit("yourShape", socket.shape);


    });

    var cleaning = function(room) {
        history[room] = [];
        io.sockets.in(room).emit('clean');
        przechowalnia[room] = "Cross";
        blockGame[room] = false;
        punkt[room] = 0;

    };

    socket.on('newGame', function() {
        if (socket.shape) {
            cleaning(socket.room);
            io.sockets.in(socket.room).emit('turn', "Circle");
        }
    });

    socket.on('disconnect', function() {
        for (var i = 0; i < listaGier.length; i++) {
            if (listaGier[i].key == socket.room) {
                if (listaGier[i].circle == socket.username) {
                    listaGier[i].circle = null;
                    cleaning(socket.room);
                } else if (listaGier[i].cross == socket.username) {
                    listaGier[i].cross = null;
                    cleaning(socket.room);

                }
            }
        }
        if (socket.username) {
            delete usernames[socket.username];
            socket.broadcast.emit('updateChat', 'SERWER', socket.username + ' rozłączył się');
            socket.leave(socket.room);
        }
        users = [];
            for (var element in usernames) {
            users.push(element);
        }
        io.sockets.in(socket.room).emit('usersLobby', users);

        
    });
});


httpServer.listen(port, function() {
    console.log('Serwer HTTP działa na porcie ' + port);
});
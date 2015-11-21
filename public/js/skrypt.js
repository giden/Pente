/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false */
/*global $:false */
"use strict";

var roomAdd = $("#roomAdd");
var dataSend = $("#dataSend");
var newGame = $("#newGame");
var roomName = $("#roomName");
var dataChat = $("#dataChat");

roomAdd.prop('disabled', true);
dataSend.prop('disabled', true);
newGame.prop('disabled', true);
roomName.prop('disabled', true);
dataChat.prop('disabled', true);

// Inicjalizacja
$(document).ready(function() {
    var socket;
    if (!socket || !socket.connected) {
        socket = io({
            forceNew: true
        });
    }

    socket.on('connect', function() {
        var nick = prompt("Podaj nick: ");
        if (nick) {
            socket.emit('login', nick);

            roomAdd.prop('disabled', false);
            dataSend.prop('disabled', false);
            newGame.prop('disabled', false);
            roomName.prop('disabled', false);
            dataChat.prop('disabled', false);

        }
    });

    

    socket.on('updateChat', function(username, data) {
        $('#rozmowa').prepend('<b>' + username + ':</b> ' + data + '<br>');
    });

    socket.on('draw', function(history) {
        if (history) {
            history.forEach(function(obj) {
                $("#" + obj.pos).attr('class', 'gobanCell1' + obj.shape);

            });
        }
    });

    socket.on('wygrana', function(id) {
        $("#" + id).parent().attr('class', 'gobanColPinki');
    });

    socket.on('wynik', function(text) {
        $("#wynik").html(text);
    });


    socket.on('turn', function(shape) {
        $("#turn").html("Tura " + shape);
        $("#shapeTurn").attr('class', 'gobanCell1' + shape);
        $("#wait").html("");
    });
    socket.on('wait', function(shape) {
        $("#wait").html(", czekaj");
    });

    socket.on('clean', function(history) {
        $(".gobanCell1Circle").attr('class', 'gobanCell1');
        $(".gobanCell1Cross").attr('class', 'gobanCell1');
        $("#wait").html("");
        $("#turn").html("");
        $(".gobanColPinki").attr('class', 'gobanCol');

    });

    socket.on('yourShape', function(shape) {
        $("#yourShape").attr('class', 'gobanCell2' + shape);

    });
    socket.on('selectUsers', function(user1, user2) {
        $("#selectUsers").html(user1 + "<br />" + user2);

    });
    socket.on('usersLobby', function(usernames) {

        $("#selectUsers").html("");
        usernames.forEach (function(element) {
            $("#selectUsers").html($("#selectUsers").html() + element + "<br />");
        });

    });



    socket.on('updateRooms', function(rooms, current_room) {
        $('#rooms').empty();
        $.each(rooms, function(key, value) {
            if (value == current_room) {
                $('#rooms').append('<div>' + value + '</div>');
            } else {
                $('#rooms').append('<div class="change">' + value + '</a></div>');
            }
        });
    });



    dataSend.click(function() {
        var message = $('#dataChat').val();
        $('#dataChat').val('');
        socket.emit('sendChat', message);
    });

    $('#dataChat').keypress(function(e) {
        if (e.which == 13) {
            var message = $('#dataChat').val();
            $('#dataChat').val('');
            socket.emit('sendChat', message);
        }
    });

    roomAdd.click(function() {
        var name = $('#roomName').val();
        $('#roomName').val('');
        if (name)
            socket.emit('create', name);
    });

    $('#rooms').on('click', '.change', function() {
        var room = $(this).text();
        socket.emit('switchRoom', room);
    });
    $('#goban').on('click', '.gobanCol', function() {
        var id = $(this).children().attr('id');
        socket.emit('addShape', id);
    });

    newGame.click(function() {
        socket.emit('newGame');
    });



});
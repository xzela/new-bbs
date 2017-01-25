'use strict';

const app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	is = require('is_js');

let clients = {};

app.get('/', function(req, res) {
	return res.sendFile( __dirname + '/index.html');
});

io.on('connection', function(socket) {
	
	if (Object.keys(clients).length <= 0) {
		clients[socket.id] = {
			id: socket.id,
			status: 'active'
		};
	} else {
		clients[socket.id] = {
			id: socket.id,
			status: 'queued'
		};
	}
	
	socket.on('status:init', () => {
		socket.emit('status:check', clients[socket.id].status);
	});
		
	socket.on('disconnect', function() {
		console.log(clients[socket.id]);
		// is the socket currently active?
		if (clients[socket.id].status === 'active') {
			let ids = Object.keys(clients);
			
			let next = ids.find((id) => {
				if (clients[id].status === 'queued') {
					return true;
				}
			});
			
			if (is.existy(next)) {
				console.log(next);
				clients[next].status = 'active';
				socket.to(next).emit('status:check', clients[next].status);
			}
		}
		// remove the current socket
		delete clients[socket.id];
		console.log(`socket: ${socket.id} has disconnected`);
	});

});

http.listen(3001, () => {
	console.log('listening on *:3001');
});
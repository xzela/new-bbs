'use strict';

const app = require('express')(),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	is = require('is_js'),
	nunjucks = require('nunjucks'),
	uuid = require('uuid/v4');

let clients = {},
	t;

nunjucks.configure({express: app});

app.set('views', __dirname + 'views');
app.set('view engine', 'njk');

app.use(session({
	secret: 'keyboardcat',
	resave: true,
	name: 'kiram-kyler',
	genid: function () {
		return uuid();
	},
	saveUninitialized: true,
	cookie: { 
		maxAge: 60 * 60 * 1000
	}
}));
app.use(cookieParser());

app.get('/', function(req, res) {
	let sessionId = req.sessionID;
	return res.render('./views/index', {sessionId: sessionId});
});

setInterval(function () {
	// console.log(clients);
	// console.log('-');
}, 1000);

function timer(bool) {
	
	if (bool) {
		return clearInterval(t);
	}
	return;
}

function findClientBySessionId(sessionId, clients) {
	let keys = Object.keys(clients);
	for (let i = 0; i < keys.length; ++i) {
		let client = clients[keys[i]];
		// if the session ids match, then the same person has come back
		if (client.sessionId === sessionId) {
			return client;
		}
	}
	return;
}

io.on('connection', function(socket) {
	// 1. When a client connects for the first time, see if their session already
	// exists. 
		
	// console.log('connect', socket.id);	
	socket.on('status:init', (data) => {
		// no one has connected yet
		let keys = Object.keys(clients);
		if (keys.length <= 0) {
			clients[socket.id] = {
				id: socket.id,
				sessionId: data.sessionId,
				prune: false,
				status: 'active'
			};
			return socket.emit('status:check', clients[socket.id].status);
		}
		let client = findClientBySessionId(data.sessionId, clients);

		if (is.existy(client)) {
			console.log(`${client.sessionId} still ${client.status}`);
			// console.log(client.sessionId, 'still active');
			clients[socket.id] = {
				id: socket.id,
				sessionId: data.sessionId,
				prune: false,
				status: client.status
			};
			delete clients[client.id];
			clearTimeout(t);
			return socket.emit('status:check', clients[socket.id].status);
		}
		console.log(data.sessionId, 'queued');
		// test to see if the client has already connected 
		// we want to preserve their state

		clients[socket.id] = {
			id: socket.id,
			sessionId: data.sessionId,
			status: 'queued'
		};

		// clients[socket.id].sessionId = data.sessionId;
		return socket.emit('status:check', clients[socket.id].status);
	});
		
	socket.on('disconnect', function() {
		// the client may have disconnected but, we want to wait to see if they 
		// come back. 
		
		
		// is the socket currently active?
		if (is.existy(clients[socket.id]) && clients[socket.id].status === 'active') {
			let client = clients[socket.id];
			client.prune = true;
			// if the active client disconnected, wait 5 seconds to see if they 
			// come back before making the next client active
			console.log(client.sessionId, 'checking');
			t = setTimeout(function () {
				if (client.prune) {
					console.log('prune', client.id);
					let ids = Object.keys(clients);
					let nextId = ids.find((id) => {
						if (clients[id].status === 'queued') {
							return true;
						}
					});
					
					if (is.existy(nextId)) {
						console.log(clients[nextId].sessionId, 'is becoming active?');
						clients[nextId].status = 'active';
						socket.to(nextId).emit('status:check', clients[nextId].status);
					}
					console.log(client.sessionId, 'deleting');
					delete clients[socket.id];
				}
			}, 1000);
		}
		// remove the current socket
		// delete clients[socket.id];
		// console.log(`socket: ${socket.id} has disconnected`);
	});

});

http.listen(3001, () => {
	console.log('listening on *:3001');
});
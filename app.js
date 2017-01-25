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
	njk = nunjucks.configure({
		express: app
	});

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
	return res.render('./views/index', {sessionId: req.sessionID});
});

io.on('connection', function(socket) {
	console.log('connect', socket.id);
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
	
	socket.on('status:init', (data) => {
		console.log('init', data);
		clients[socket.id].sessionId = data.sessionId;
		socket.emit('status:check', clients[socket.id].status);
	});
		
	socket.on('disconnect', function() {
		// is the socket currently active?
		if (clients[socket.id].status === 'active') {
			let ids = Object.keys(clients);
			
			let nextId = ids.find((id) => {
				if (clients[id].status === 'queued') {
					return true;
				}
			});
			
			if (is.existy(nextId)) {
				clients[nextId].status = 'active';
				socket.to(nextId).emit('status:check', clients[nextId].status);
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
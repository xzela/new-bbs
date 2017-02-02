'use strict';
const uuid = require('uuid/v4'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	RedisStore = require('connect-redis')(session),
	Redis = require('ioredis'),
	serveStatic = require('serve-static');


function initCookieParser() {
	return cookieParser();
}

function initStaticServe(path) {
	return serveStatic(path);
}

function initSession() {
	return session({
		cookie: {
			maxAge: 60 * 60 * 1000
		},
		genid: function () {
			return uuid();
		},
		name: 'kiram-kyler',
		resave: true,
		saveUninitialized: true,
		secret: 'keyboardcat',
		store: new RedisStore({
			client: new Redis({
				keyPrefix: 'bbs::session:'
			}),
			host: 'localhost',
			prefix: '',
			ttl: 999
		})
	});
}

module.exports = {
	initCookieParser,
	initSession,
	initStaticServe
};

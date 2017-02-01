'use strict';
const uuid = require('uuid/v4'),
	cookieParser = require('cookie-parser'),
	serveStatic = require('serve-static'),
	session = require('express-session');

function initCookieParser() {
	return cookieParser();
}

function initStaticServe(path) {
	return serveStatic(path);
}

function initSession() {
	return session({
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
	});
}

module.exports = {
	initCookieParser,
	initSession,
	initStaticServe
};

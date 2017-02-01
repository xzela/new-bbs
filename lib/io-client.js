'use strict';

class IoClient {

	constructor(raw) {
		this.id = raw.id;
		this.sessionId = raw.sessionId;
		this.status = raw.status;
		this.prune = raw.prune || false;
	}

};
module.exports = IoClient;

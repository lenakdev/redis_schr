class Hook {

    constructor() {

    }

    onExpire(scheduledMessage) {
        throw new Error('not supported');
    }

}

module.exports = Hook;
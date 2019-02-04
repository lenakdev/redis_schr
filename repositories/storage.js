class Storage {

    constructor(hook) {
    }

    schedule(scheduledMessage) {
        throw new Error('not supported');
    }
}

module.exports = Storage;
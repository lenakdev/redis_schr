class Hook {

    onExpire(scheduledMessage) {
        throw new Error('not supported');
    }

}

module.exports = Hook;
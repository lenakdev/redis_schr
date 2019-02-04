const Hook = require('../Hook');

class ConsolePrintHook extends Hook {
    constructor() {
        super();
    }

    onExpire(scheduledMessage) {
        console.log('Message expired: ' + scheduledMessage.getMessage());
    }
}

module.exports = ConsolePrintHook;
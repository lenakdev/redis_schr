const Storage = require('../repositories/redis/redisStorage');
const ScheduledMessage = require('../models/ScheduledMessage');
const Hook = require('./hooks/ConsolePrintHook');

class Scheduler {
    constructor() {
        this.storage = new Storage(new Hook());
        this.storage.connect();
    }

    schedule(time, message) {
        let scheduledMessage = ScheduledMessage.of(time, message);
        return this.storage.schedule(scheduledMessage);
    }

}

module.exports = Scheduler;
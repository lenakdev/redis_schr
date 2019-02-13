const uuidV4 = require('uuid/v4');

module.exports = class ScheduledMessage {
    constructor(id, time, message) {
        this.id = id;
        this.time = time;
        this.message = message;
    }

    getId() {
        return this.id;
    }

    getTime() {
        return this.time;
    }

    getMessage() {
        return this.message;
    }

    static of(time, message) {
        let timeInMillis = new Date(time).getTime();
        return new ScheduledMessage(uuidV4(), timeInMillis, message);
    }

    static fromJSON(json) {
        let obj = JSON.parse(json);
        return new ScheduledMessage(obj.id, obj.time, obj.message);
    }

}




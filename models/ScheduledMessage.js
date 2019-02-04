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
        return new ScheduledMessage('id_' + Date.now(), timeInMillis, message);
    }

    static fromJSON(json) {
        let obj = JSON.parse(json);
        return new ScheduledMessage(obj.id, obj.time, obj.message);
    }

}




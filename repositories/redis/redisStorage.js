const Redis = require('ioredis');
const Storage = require('../storage');
const ScheduledMessage = require('../../models/ScheduledMessage')

class RedisStorage extends Storage {

    constructor(hook) {
        super(hook);
        this._hook = hook;
    }

    connect() {
        if (this._client) {
            return Promise.resolve();
        }

        this._client = new Redis(6379, '127.0.0.1');
        this._sortedSetName = 'prioritizedMessages';

        let connect = new Promise((res, rej) => {
            this._client.once('ready', () => {
                this._pollAndMoveExpiredMessages();
            }).once('error', ()=>{
                console.log("Could not connect to Redis.")
            });
        }).then(() => {
            return Promise.resolve();
        });
        return connect;
    }

    schedule(scheduledMessage) {
        let schedule = this._client.pipeline()
            .rpush(scheduledMessage.getTime(), JSON.stringify(scheduledMessage))
            .zadd(this._sortedSetName, scheduledMessage.getTime(), scheduledMessage.getTime())
            .exec(function (err, results) {
        });
        return schedule;
    }

    _pollAndMoveExpiredMessages() {
        const self = this;
        let checkList = function (res, rej) {
            let args = [self._sortedSetName, -1, Date.now() + 1, 'LIMIT', 0, 1];
            self._client.zrangebyscore(args, (err, response) => {
                if (err) {
                    throw err;
                }
                if (response.length > 0) {
                    self._client.pipeline()
                        .lrange([response[0], 0, -1], function (err, result) {
                            if (err) {
                                throw err;
                            }
                            if (result) {
                                result.forEach(function (value) {
                                    self._hook.onExpire(ScheduledMessage.fromJSON(value));
                                });
                            }
                        })
                        .zrem(self._sortedSetName, response[0])
                        .del(response[0])
                        .exec(function (err, result) {
                            if (err) {
                                throw err;
                            }
                        });

                }
                setTimeout(checkList, 1000);

            });
        };
        return new Promise(checkList);
    }

    _onError(e) {
        console.log('Error: ', e);
    }

}

module.exports = RedisStorage;
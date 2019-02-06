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
        this._pollingClient = this._client.duplicate();
        this._sortedSetName = 'prioritizedMessages';
        this._listOfExpiredMsgs = 'toDoMessages';

        let connect = new Promise((res, rej) => {
            this._client.once('ready', () => {
                this._pollAndMoveExpiredMessages();
                this._fireExpiredMessage(this._hook.onExpire);
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
            .zadd(this._sortedSetName, scheduledMessage.getTime(), scheduledMessage.getId())
            .hset(scheduledMessage.getId(), 'data', JSON.stringify(scheduledMessage))
            .exec(function (err, results) {
        });
        return schedule;
    }

    _pollAndMoveExpiredMessages() {
        const self = this;
        let checkList = function(res,rej) {
            let args = [self._sortedSetName, -1, Date.now() + 1];
            self._client.zrangebyscore(args, (err, response) => {
                if (err) {
                    throw err;
                }
                if (response.length > 0) {
                    self._client.pipeline()
                        .zremrangebyscore(args)
                        .rpush(self._listOfExpiredMsgs, response)
                        .exec(function (err) {
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

    _fireExpiredMessage(onExpire) {
        const self = this;

        let blockAndCheckList = function () {
            self._pollingClient.blpop([self._listOfExpiredMsgs, 0], (err, result) => {
                if (err) {
                    throw err;
                }
                self._client.hget(result[1], 'data', (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                    }
                    let scheduledMessage = ScheduledMessage.fromJSON(data);
                    onExpire(scheduledMessage);
                    self._client.hdel(result[1], 'data', (err) => {
                        if (err) {
                            console.log('Error: ', err);
                        }
                    })
                });
                setImmediate(blockAndCheckList);
            });
        };
        return new Promise(blockAndCheckList);
    }

    _onError(e) {
        console.log('Error: ', e);
    }

}

module.exports = RedisStorage;
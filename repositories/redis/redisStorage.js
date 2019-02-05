const redis = require('redis');
const bluebird = require('bluebird');
const Storage = require('../storage');
const ScheduledMessage = require('../../models/ScheduledMessage')
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

class RedisStorage extends Storage {

    constructor(hook) {
        super(hook);

        this._client = redis.createClient('6379', 'localhost');
        this._pollingClient = this._client.duplicate();
        this._sortedSetName = 'prioritizedMessages';
        this._listOfExpiredMsgs = 'toDoMessages';

        this._pollAndMoveExpiredMessages();
        this._fireExpiredMessage(hook.onExpire);
    }

    schedule(scheduledMessage) {
        let schedule = this._client.multi()
            .zadd(this._sortedSetName, scheduledMessage.getTime(), scheduledMessage.getId())
            .hset(scheduledMessage.getId(), 'data', JSON.stringify(scheduledMessage))
            .execAsync()
            .then(() => {
                return Promise.resolve();
            });
        return schedule;
    }

    _pollAndMoveExpiredMessages() {
        const self = this;
        let checkList = function(res,rej) {
            let args = [self._sortedSetName, -1, Date.now() + 1, 'LIMIT', 0, 1];
            self._client.zrangebyscore(args, (err, response) => {
                if (err) {
                    throw err;
                }
                if (response.length > 0) {
                    self._client.multi()
                        .zrem(self._sortedSetName, response[0])
                        .rpush(self._listOfExpiredMsgs, response[0])
                        .exec(function (err) {
                            if (err) {
                                throw err;
                            }
                            setImmediate(checkList);
                        });
                } else {
                    setTimeout(checkList, 1000);
                }
            });
        };
        return new Promise(checkList);
    }

    _fireExpiredMessage(onExpire) {
        const self = this;

        let blockAndCheckList = Promise.promisify(function () {
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
        }
        return Promise.promisify(blockAndCheckList);
    }

}

module.exports = RedisStorage;
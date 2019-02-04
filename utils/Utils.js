class Utils {
    static delay(res, delay) {
        return new Promise((res, rej) => {
            setTimeout(res, delay);
        });
    }
}

module.exports = Utils;
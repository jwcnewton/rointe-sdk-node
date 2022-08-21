
const default_time = "Europe/London"

const utils = {
    now: (time_zone) => {
        if(!time_zone){
            time_zone = default_time
        }
        return new Date(new Date().toLocaleString("en-US", { timeZone: time_zone }));
    },

    delta: (timeInSeconds) => {
        const dateNow = utils.now()

        return new Date(
            dateNow.getTime() + (1000 * parseInt(timeInSeconds))
        )
    }
}

module.exports = utils;

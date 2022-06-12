
const default_time = "Europe/London"
const now = (time_zone) => {
    if(!time_zone){
        time_zone = default_time
    }
    return new Date(new Date().toLocaleString("en-US", { timeZone: time_zone }));
}

const delta = (timeInSeconds) => {
    const dateNow = now()

    return new Date(
        dateNow.getTime() + (1000 * parseInt(timeInSeconds))
    )
}

exports.now = now;
exports.delta = delta;
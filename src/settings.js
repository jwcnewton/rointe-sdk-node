const settings = {
    AUTH_HOST : "https://www.googleapis.com",
    AUTH_VERIFY_URL : "/identitytoolkit/v3/relyingparty/verifyPassword",
    AUTH_ACCT_INFO_URL : "/identitytoolkit/v3/relyingparty/getAccountInfo",
    AUTH_TIMEOUT_SECONDS : 15,
    AUTH_REFRESH_ENDPOINT : "https://securetoken.googleapis.com/v1/token",
    FIREBASE_APP_KEY : "AIzaSyBi1DFJlBr9Cezf2BwfaT-PRPYmi3X3pdA",
    FIREBASE_DEFAULT_URL : "https://elife-prod.firebaseio.com",
    FIREBASE_INSTALLATIONS_PATH : "/installations2.json",
    FIREBASE_DEVICES_PATH_BY_ID : (device_id) => {
        return `/devices/${device_id}.json`
    },
    FIREBASE_DEVICE_DATA_PATH_BY_ID : (device_id) => {
        return `/devices/${device_id}/data.json`
    },
    FIREBASE_DEVICE_ENERGY_PATH_BY_ID : (device_id) => {
        return `/history_statistics/${device_id}/daily/`
    },
    ENERGY_STATS_MAX_TRIES : 5
}

module.exports = settings;
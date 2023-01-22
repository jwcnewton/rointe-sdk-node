const ROINTE_SETTINGS = {
    FIREBASE_APP_KEY: "AIzaSyBi1DFJlBr9Cezf2BwfaT-PRPYmi3X3pdA",
    FIREBASE_DEFAULT_URL: "https://elife-prod.firebaseio.com"
}

const EQUATION_SETTINGS = {
    FIREBASE_APP_KEY: "AIzaSyDfqBq3AfIg1wPjuHse3eiXqeDIxnhvp6U",
    FIREBASE_DEFAULT_URL: "https://oem2-elife-cloud-prod-default-rtdb.firebaseio.com"
}

const settings = (is_rointe) => {
    console.log(`Use rointe configuration? : ${is_rointe}`)

    return Object.assign({
        AUTH_HOST: "https://www.googleapis.com",
        AUTH_VERIFY_URL: "/identitytoolkit/v3/relyingparty/verifyPassword",
        AUTH_ACCT_INFO_URL: "/identitytoolkit/v3/relyingparty/getAccountInfo",
        AUTH_TIMEOUT_SECONDS: 15,
        AUTH_REFRESH_ENDPOINT: "https://securetoken.googleapis.com/v1/token",
        FIREBASE_INSTALLATIONS_PATH: "/installations2.json",
        FIREBASE_DEVICES_PATH_BY_ID: (device_id) => {
            return `/devices/${device_id}.json`
        },
        FIREBASE_DEVICE_DATA_PATH_BY_ID: (device_id) => {
            return `/devices/${device_id}/data.json`
        },
        FIREBASE_DEVICE_ENERGY_PATH_BY_ID: (device_id) => {
            return `/history_statistics/${device_id}/daily/`
        },
        ENERGY_STATS_MAX_TRIES: 5
    }, is_rointe ? ROINTE_SETTINGS : EQUATION_SETTINGS);
}


module.exports = settings;
const axios = require('axios');
const settings = require('./settings');
const utils = require('./utils');

class ApiResponse {
    constructor(success, data, error_message) {
        this.success = success;
        this.data = data;
        this.error_message = error_message;
    }
}

class rointe_api {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async initialize_authentication() {
        const login_data = await this._login_user()

        if (!login_data.success) {
            this.auth_token = null
            this.refresh_token = null
            return login_data
        }

        this.auth_token = login_data.data["auth_token"]
        this.refresh_token = login_data.data["refresh_token"]
        this.auth_token_expire_date = login_data.data["expires"]

        this._clean_credentials()

        return new ApiResponse(true, null, null)
    }

    async get_local_id() {
        if (!(await this._ensure_valid_auth())) {
            return new ApiResponse(false, null, "Invalid authentication.")
        }
        const payload = { "idToken": this.auth_token }
        var response;
        try {
            response = await axios.post(
                `${settings.AUTH_HOST}${settings.AUTH_ACCT_INFO_URL}?key=${settings.FIREBASE_APP_KEY}`, payload)
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${ex}`)
        }

        if (response == null || !response) {
            return new ApiResponse(
                false, null, "No response from API call to get_local_id()"
            )
        }

        if (response.status != 200) {
            return new ApiResponse(
                false, null, "get_local_id() returned {response.status_code}"
            )
        }

        const response_json = response.data

        return new ApiResponse(true, response_json["users"][0]["localId"], null)
    }

    async get_installation_by_name(local_id, name) {
        const get_installs = await this.get_installations(local_id);

        if (get_installs.success) {
            const install_data = get_installs.data;
            const install_keys = Object.keys(install_data);

            for (let i = 0; i < install_keys.length; i++) {
                const install_key = install_keys[i];
                const install = install_data[install_key]
                if (install.name == name) {
                    return new ApiResponse(true, install, null);
                }
            }

            return new ApiResponse(false, null, `Failed to match install name ${name}`)
        } else {
            return get_installs;
        }
    }

    async get_all_devices_by_installation_name(local_id, name) {
        const get_installs = await this.get_installation_by_name(local_id, name);
        if (get_installs.success) {
            const install_zones = get_installs.data.zones;
            const zone_keys = Object.keys(install_zones);
            let device_results = []
            for (let i = 0; i < zone_keys.length; i++) {
                const zone = install_zones[zone_keys[i]]

                if (zone.devices != null){
                    const devices = Object.keys(zone.devices);

                    for (let j = 0; j < devices.length; j++) {
                        const device_id = devices[j];
                        device_results.push({
                            'device_id': device_id,
                            'active': zone.devices[device_id]
                        })
                    }
                }
            }
            return new ApiResponse(true, device_results, null);
        } else {
            return get_installs;
        }
    }

    async get_installations(local_id) {

        if (!(await this._ensure_valid_auth())) {
            return new ApiResponse(false, null, "Invalid authentication.")
        }

        var response;
        try {
            response = await axios.get(
                `${settings.FIREBASE_DEFAULT_URL}${settings.FIREBASE_INSTALLATIONS_PATH}`,
                {
                    params: {
                        "auth": this.auth_token,
                        "orderBy": '"userid"',
                        "equalTo": `"${local_id}"`,
                    }

                })
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${ex}`)
        }

        if (!response) {
            return new ApiResponse(false, null, "No response from API in get_installations()")
        }

        if (response.status != 200) {
            return new ApiResponse(
                false, null, `get_installations() returned ${response.status}`
            )
        }

        const response_json = response.data

        return new ApiResponse(true, response_json, null)
    }

    async get_device(device_id) {
        if (!(await this._ensure_valid_auth())) {
            return new ApiResponse(false, null, "Invalid authentication.")
        }
        const args = { "auth": this.auth_token }
        var response;
        try {
            response = await axios.get(
                `${settings.FIREBASE_DEFAULT_URL}${settings.FIREBASE_DEVICES_PATH_BY_ID(device_id)}`,
                {
                    params: args
                })
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${ex}`)
        }

        if (!response) {
            return new ApiResponse(false, null, "No response from API in get_installations()")
        }

        if (response.status != 200) {
            return new ApiResponse(
                false, null, `get_device() returned ${response.status}`
            )
        }
        const response_json = response.data

        return new ApiResponse(true, response_json, null)
    }

    async set_device_temp(device_id, new_temp, power=true) {
        if (!(await this._ensure_valid_auth())) {
            return new ApiResponse(false, null, "Invalid authentication.")
        }
        const args = { "auth": this.auth_token }
        const body = { "temp": new_temp, "mode": "manual", "power": power }
        const url = `${settings.FIREBASE_DEFAULT_URL}${settings.FIREBASE_DEVICE_DATA_PATH_BY_ID(device_id)}`
        return this._send_patch_request(url, args, body)
    }

    async get_latest_energy_stats(device_id) {

       var target_date = utils.now()
       target_date.setMinutes(0)
       target_date.setSeconds(0)
       target_date.setMilliseconds(0)
        // Attempt to retrieve the latest value. If not found, go back one hour. Max 5 tries.
        var attempts = settings.ENERGY_STATS_MAX_TRIES

        while (attempts > 0) {
            var result = await this._retrieve_hour_energy_stats(device_id, target_date)

            if (result.error_message == "No energy stats found."){
                attempts = attempts - 1
                target_date.setHours(target_date.getHours() + 1)
            } else {
                return result
            }
        }
        return new ApiResponse(false, null, "Max tries exceeded.")
    }

    async _retrieve_hour_energy_stats(device_id, target_date) {
        if (!(await this._ensure_valid_auth())) {
            return new ApiResponse(false, null, "Invalid authentication.")
        }

        //Sample URL /history_statistics/device_id/daily/2022/01/21/energy/010000.json
        const args = { "auth": this.auth_token }
        const url = `
            ${settings.FIREBASE_DEFAULT_URL}
            ${settings.FIREBASE_DEVICE_ENERGY_PATH_BY_ID(device_id)}
            ${this._format_dateTime(target_date)}/energy/
            ${target_date.getHours()}0000.json`.replace(/(\r\n|\n|\r|\s)/gm, "")

        var response;
        try {
            response = await axios.get(url,
                {
                    params: args
                })
        } catch (ex) {
            return new ApiResponse(false, null, `Error response from API in _retrieve_hour_energy_stats() ${ex}`)
        }

        if (response.status != 200) {
            return new ApiResponse(
                false, null, `_retrieve_hour_energy_stats() returned ${response.status}`
            )
        }

        const response_json = response.data

        if (response_json == null) {
            return new ApiResponse(false, null, "No energy stats found.")
        }
        const dateRange = new Date(target_date)
        dateRange.setHours(target_date.getHours() + 1)
        const now = utils.now()
        const data = {
            created: now,
            start: target_date,
            end: dateRange,
            kwh: response_json.kw_h,
            effective_power: response_json.effective_power,
        }

        return new ApiResponse(true, data, null)
    }

    /* 
        async set_device_preset(device, preset_mode) {
            if (!(await this._ensure_valid_auth())) {
                return new ApiResponse(false, null, "Invalid authentication.")
            }
            
            device_id = device.id
            args = {"auth": self.auth_token}
            body: Dict[str, Any] = {}

            url = "{}{}".format(
                FIREBASE_DEFAULT_URL, FIREBASE_DEVICE_DATA_PATH_BY_ID.format(device_id)
            )

            if preset_mode == "comfort":
                body = {
                    "power": True,
                    "mode": "manual",
                    "temp": device.comfort_temp,
                    "status": "comfort",
                }

            elif preset_mode == "eco":
                body = {
                    "power": True,
                    "mode": "manual",
                    "temp": device.eco_temp,
                    "status": "eco",
                }
            elif preset_mode == "Anti-frost":
                body = {
                    "power": True,
                    "mode": "manual",
                    "temp": device.ice_temp,
                    "status": "ice",
                }

            return self._send_patch_request(url, args, body)
        }
    */

    _clean_credentials() {
        this.username = null
        this.password = null
    }

    is_logged_in() {
        return this.auth_token != null && this.refresh_token != null;
    }

    async _ensure_valid_auth() {
        const now = utils.now()
        if (this.auth_token != null || (this.auth_token_expire_date < now)) {
            if (!(await this._refresh_token())) {
                return false
            }
        }
        return true
    }

    async _refresh_token() {
        const payload = { "grant_type": "refresh_token", "refresh_token": this.refresh_token }
        var response;
        try {
            response = await axios.post(`${settings.AUTH_REFRESH_ENDPOINT}?key=${settings.FIREBASE_APP_KEY}`, payload)
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${e}`)
        }

        if (!response) {
            return false
        }

        if (response.status != 200) {
            return false
        }

        const response_json = response.data

        if (response_json == null || response_json.id_token == null) {
            return false
        }

        this.auth_token = response_json["id_token"]
        this.auth_token_expire_date = utils.delta(response_json["expires_in"])
        this.refresh_token = response_json["refresh_token"]

        return true
    }

    async _login_user() {
        const payload = {
            "email": this.username,
            "password": this.password,
            "returnSecureToken": true,
        }
        var response;
        try {
            response = await axios.post(`${settings.AUTH_HOST}${settings.AUTH_VERIFY_URL}?key=${settings.FIREBASE_APP_KEY}`, payload)
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${ex}`)
        }

        if (response.status == 400) {
            return new ApiResponse(
                false,
                null,
                "invalid_auth",
            )
        }

        if (response.status != 200) {
            return new ApiResponse(
                false,
                null,
                "response_invalid",
            )
        }

        const response_json = response.data

        if (!response_json || response_json.idToken == null) {
            return new ApiResponse(false, null, "invalid_auth_response")
        }

        const data = {
            "auth_token": response_json["idToken"],
            "expires": utils.delta(response_json["expiresIn"]),
            "refresh_token": response_json["refreshToken"],
        }

        return new ApiResponse(true, data, null)
    }

    async _send_patch_request(url, params, body) {

        body["last_sync_datetime_app"] = Math.floor(Date.now() / 1000)

        var response;

        try {
            response = await axios.patch(url, body,
                {
                    params: params
                }
            )
        } catch (ex) {
            return new ApiResponse(false, null, `Network error ${ex}`)
        }

        if (!response) {
            return false
        }

        if (response.status != 200) {
            return false
        }

        return response;
    }

    _format_dateTime(target_date){
        const _localDateParts = target_date.toLocaleDateString("en-GB", { 
            day: "2-digit",
            year: "numeric",
            month: "2-digit",
        }).split('/')
        return `${_localDateParts[2]}/${_localDateParts[0]}/${_localDateParts[1]}`
        //.split('/').reverse().join('/');
    }
}

module.exports = rointe_api;
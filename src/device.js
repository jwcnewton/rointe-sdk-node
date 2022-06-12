import { EnergyConsumptionData } from 'dto';
import { now, delta } from 'utils';

const DeviceMode = {
    AUTO: "auto",
    MAN: "manual"
}

class ScheduleMode {
    constructor(device_id, device_info, energy_data) {
        this.id = device_id
        this.type = device_info["data"]["type"]
        this.product_version = device_info["data"]["product_version"].toLowerCase()
        this.serialnumber = device_info["serialnumber"]
        this.update_data(device_info, energy_data)
    }

    update_data(device_info, energy_data) {
        data = device_info["data"]

        this.name = data["name"]
        this.nominal_power = parseInt(data["nominal_power"])
        this.power = Boolean(data["power"])
        this.preset = data["status"]
        this.mode = data["mode"]

        this.temp = parseFloat(data["temp"])
        this.temp_calc = parseFloat(data["temp_calc"])
        this.temp_probe = parseFloat(data["temp_probe"])

        this.comfort_temp = parseFloat(data["comfort"])
        this.eco_temp = parseFloat(data["eco"])
        this.ice_temp = parseFloat(data["ice"])

        // User mode settings are only valid for V2 radiators.
        if (product_version == "v2") {
            this.um_max_temp = parseFloat(data["um_max_temp"])
            this.um_min_temp = parseFloat(data["um_min_temp"])
            this.user_mode = Boolean(data["user_mode"])
        }
        else {
            this.user_mode = false
        }
        ice_mode = Boolean(data["ice_mode"])
        schedule = data["schedule"]
        schedule_day = data["schedule_day"]
        schedule_hour = data["schedule_hour"]

        energy_data = energy_data


        this.last_sync_datetime_app = new Date(
            parseInt(data["last_sync_datetime_app"]) / 1000.0
        ).toLocaleString()

        this.last_sync_datetime_device = new Date(
            parseInt(data["last_sync_datetime_device"]) / 1000.0
        ).toLocaleString()

        this.hass_available = true
    }

    get_current_schedule_mode() {
        // Returns C for Comfort, E for Eco, O for no-schedule

        day_time = now()
        day_of_week = day_time.getDay()
        hour_index = day_time.getHours()

        current_mode = self.schedule[day_of_week][hour_index]

        if (current_mode == "C")
            return ScheduleMode.COMFORT
        else if (current_mode == "E")
            return ScheduleMode.ECO
        else
            return ScheduleMode.NONE
    }

    user_mode_supported() {
        // Return True if this device supports user mode."""
        return this.product_version == "v2"
    }
}
class EnergyConsumptionData {
    start = null
    end = null
    kwh = null
    effective_power = null
    created = null

    constructor(start, end, kwh, effective_power, created) {
        this.start = start;
        this.end = end;
        this.kwh = kwh;
        this.effective_power = effective_power;
        this.created = created;
    }
}

module.exports = EnergyConsumptionData;
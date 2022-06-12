# rointe-sdk-node
Node SDK for Rointe 

## Example Usage

```js
// Creating a new API Object
const rointe_api = new api("EMAIL", "PASSWORD");

// Initialize authentication (This might be moved into the constructor for simplicity) 
const auth = await rointe_api.initialize_authentication();
```

```js
// Get the local id - unique for the account
const localId = await rointe_api.get_local_id();
```

```js
// Get installation by name (whatever you called the installation)
const devices = await rointe_api.get_all_devices_by_installation_name(localId.data, "Home")
```

```js
// Get device info - firmware, temp, etc.
const device = await rointe_api.get_device(devices.data[0].device_id)
```

```js
// Set the device temp to 10
const response = await rointe_api.set_device_temp(devices.data[0].device_id, 10)
```
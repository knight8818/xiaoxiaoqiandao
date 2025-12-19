const getAccessToken = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    return userInfo.access_token
}

const getCurrentCheckInBasicInfo = () => {
    return {
        "cid": localStorage["cid"],
        "title": localStorage.getItem("checkin_title"),
    }
}

const fetchCheckInDetail = async (accessToken, cid) => {
    let url = new URL("https://api-xcx.qunsou.co/xcx/checkin/v5/detail")
    const params = { access_token: accessToken, cid: cid, random_num: Math.random() }
    url.search = new URLSearchParams(params).toString()

    const res = await fetch(url)
    const data = await res.json()
    return data.data
}

const constructWifiLocationInfo = (lat, lon, accuracy = null, wifi = null) => {
    // wifi struct { ssid, bssid }
    wifi = wifi ? `${wifi.ssid}:${wifi.bssid}` : ""
    accuracy = accuracy ?? 100
    return {
        latitude: lat,
        longitude: lon,
        accuracy: accuracy,
        wifi: wifi,
    }
}

const requestCheckIn = async (accessToken, cid, wifiLocationInfo) => {
    const body = {
        cid: cid,
        latitude: 0,
        longitude: 0,
        access_token: accessToken,
        wifi_location_info: wifiLocationInfo,
    }

    const res = await fetch("https://api-xcx.qunsou.co/xcx/checkin/v3/doit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    return data
}

const getRandomCoordinates = (lat, lon, rangeInMeters) => {
    const R = 6378.1 // Radius of the Earth in km
    const brng = Math.random() * 2 * Math.PI // Bearing is 0 to 360 in radians.
    const d = rangeInMeters / 1000 / R // Distance in km
  
    const lat1 = lat * Math.PI / 180 // Current lat point converted to radians
    const lon1 = lon * Math.PI / 180 // Current long point converted to radians
  
    let lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(d) + 
        Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    )
  
    let lon2 = lon1 + Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1), 
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )
  
    // Convert back to degrees
    lat2 = lat2 * 180 / Math.PI
    lon2 = lon2 * 180 / Math.PI
  
    return {lat: lat2, lon: lon2}
}

const accessToken = getAccessToken()
const basicInfo = getCurrentCheckInBasicInfo()
console.log(`current check in: ${basicInfo.title}`)

const detail = await fetchCheckInDetail(accessToken, basicInfo.cid)
console.log(`checking in as ${detail.alias}`)

const loc = detail.locations[0]
console.log(`destination: ${loc.address} (${loc.latitude}, ${loc.longitude}), allowing error: ${loc.range}m`)

let emulating = getRandomCoordinates(loc.latitude, loc.longitude, loc.range)
emulating = { lat: emulating.lat.toFixed(6), lon: emulating.lon.toFixed(6) }
console.log(`location to be emulated: (${emulating.lat}, ${emulating.lon})`)

const wifiLocationInfo = constructWifiLocationInfo(emulating.lat, emulating.lon)

console.log(`requesting check in ...`)
const result = await requestCheckIn(accessToken, basicInfo.cid, wifiLocationInfo)
console.log(result)
console.log(`done`)

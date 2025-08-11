import axios from "https://cdn.skypack.dev/axios";
// import axios from "axios";

async function getCoords(location) {
    try {
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: location,
                format: "json"
            }
        });
        if (res.data.length === 0) {
            return console.log("ERROR 404: Location Not Found!");
        }
        const { lat, lon } = res.data[0];
        return { lat, lon };
    } catch (err) {
        console.error("Failed to fetch coordinates!", err);
    }
}

async function initMap(containerId, location) {
    try {
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: location,
                format: "json"
            }
        });
        if (res.data.length === 0) {
            return console.log("ERROR 404: Location Not Found!");
        }
        const { lat, lon } = res.data[0];
        const map = L.map(containerId).setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        L.marker([lat, lon]).addTo(map).openPopup();
    } catch (err) {
        console.error("Failed to show map!", err);
    }
}

async function reverseCoordinates(lat, lon) {
    try {
        const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
            params: {
                lat: lat,
                lon: lon,
                format: "json"
            }
        });
        const address = res.data.address;
        if (!address) {
            return console.log("unable to geocode!");
        }
        return address;
    } catch (err) {
        console.error("Failed to reverse geocode!");
    }
}

async function createCustomIcon(url, containerId, location) {
    try {
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: location,
                format: "json"
            }
        });
        if (res.data.length === 0) {
            return console.log("ERROR 404: Location Not Found!");
        }
        const { lat, lon } = res.data[0];

        const map = L.map(containerId).setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        const customIcon = L.icon({
            iconUrl: url,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38]
        });
        L.marker([lat, lon], { icon: customIcon }).addTo(map).openPopup();
    } catch (err) {
        console.error("Failed to show map!", err);
    }
}

async function getLocations(containerId, locations) {
    try {
        let coords = [];
        for (let location of locations) {
            let res = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {
                    q: location,
                    format: "json"
                }
            });
            if (res.data.length !== 0) {
                let loc = {
                    place: location,
                    lat: res.data[0].lat,
                    lon: res.data[0].lon
                }
                coords.push(loc);
            } else {
                console.warn(`Location Not Found: ${location}`);
            }
        }

        if (coords.length === 0) {
            console.error("No valid coordinates found.");
            return;
        } else if (coords.length === 1) {
            const { lat, lon, place } = coords[0];
            const map = L.map(containerId).setView([lat, lon], 13);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
            L.marker([lat, lon]).addTo(map).bindPopup(place).openPopup();
        } else {
            const bounds = coords.map(coord => [coord.lat, coord.lon]);
            const map = L.map(containerId).fitBounds(bounds);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
            for (let coord of coords) {
                const { lat, lon, place } = coord;
                L.marker([lat, lon]).addTo(map).openPopup();
            }
        }
    } catch (err) {
        console.error("failed to show locations!");
    }
}

async function routing(containerId, loc_1, loc_2) {
    try {
        const loc_1_res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: loc_1,
                format: "json"
            }
        });
        const loc_2_res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: loc_2,
                format: "json"
            }
        });
        if (loc_1_res.data.length === 0 || loc_2_res.data.length === 0) {
            return console.log("one or both the locations are invalid");
        }
        const loc_1_lat = loc_1_res.data[0].lat, loc_1_lon = loc_1_res.data[0].lon;
        const loc_2_lat = loc_2_res.data[0].lat, loc_2_lon = loc_2_res.data[0].lon;

        const jointCoords = [[loc_1_lat, loc_1_lon], [loc_2_lat, loc_2_lon]];
        const map = L.map(containerId).fitBounds([[loc_1_lat, loc_1_lon], [loc_2_lat, loc_2_lon]], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        for (let coord of jointCoords) {
            L.marker(coord).addTo(map).openPopup();
        }
        L.Routing.control({
            waypoints: [
                L.latLng(loc_1_lat, loc_1_lon),
                L.latLng(loc_2_lat, loc_2_lon)
            ]
        }).addTo(map);
    } catch (err) {
        console.error("Failed to generate route!", err);
    }
}

async function getRouteVia(containerId, locations) {
    try {
        let coords = []
        for (let location of locations) {
            const res = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {
                    q: location,
                    format: "json"
                }
            });
            if (res.data.length === 0) {
                console.log("Location Not Found!");
            }
            const data = [
                res.data[0].lat,
                res.data[0].lon
            ]
            coords.push(data);
        }

        if (coords.length === 0 || coords.length === 1) {
            return console.log("Need three or more valid locations to create route!");
        }
        const map = L.map(containerId).fitBounds([coords], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        for (let coord of coords) {
            L.marker(coord).addTo(map).openPopup();
        }
        const waypoint = coords.map(coord => L.latLng(coord[0], coord[1]));
        L.Routing.control({
            waypoints: waypoint
        }).addTo(map);
    } catch (err) {
        console.error("Failed to generate routes!", err);
    }
}

const mapWiz = {
    getCoordinates: async (location) => {
        return await getCoords(location);
    },
    showMap: async (containerId, location) => {
        await initMap(containerId, location);
    },
    reverseGeocode: async (lat, lon) => {
        return await reverseCoordinates(lat, lon);
    },
    showMapWithCustomMarker: async (url, containerId, location) => {
        await createCustomIcon(url, containerId, location);
    },
    plotMultipleLocations: async (containerId, locations) => {
        await getLocations(containerId, locations);
    },
    drawRoute: async (containerId, loc_1, loc_2) => {
        await routing(containerId, loc_1, loc_2);
    },
    drawRouteWithWaypoints: async (containerId, locations) => {
        await getRouteVia(containerId, locations);
    }
}

export default mapWiz;

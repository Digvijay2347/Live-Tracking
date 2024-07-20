let socket =io();
let currentLocation = null; // Store the current location

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            currentLocation = { latitude, longitude };
            socket.emit('send-location', { latitude, longitude });
        },
        (error) => {
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}
const map =L.map("map").setView([0,0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy Digvijay Singh 2021"
}).addTo(map)

const markers ={};

socket.on("receive-location", (data) =>{
    const {id,latitude,longitude}= data;
    map.setView([latitude,longitude]);
    if(!markers[id]){
        markers[id] = L.marker([latitude,longitude]).addTo(map);
        }else{
            markers[id].setLatLng([latitude,longitude]);
            }
});

// Ensure the event name matches the server-side event name
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Back to location button functionality
document.getElementById('back-to-location-btn').addEventListener('click', () => {
    console.log("Button clicked");
    if (currentLocation) {
        map.setView([currentLocation.latitude, currentLocation.longitude], 16);
    } else {
        console.log("Current location is not available.");
    }
});

document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&addressdetails=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const location = data[0];
                map.setView([location.lat, location.lon], 156);
            } else {
                alert("City not found.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while searching for the city.");
        });
});

// Reverse Geocoding functionality
map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const address = data.display_name;
            alert(`Address: ${address}`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while reverse geocoding.");
        });
});
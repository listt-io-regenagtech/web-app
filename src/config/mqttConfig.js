// MQTT Configuration Constants
export const brokerUrl = process.env.REACT_APP_MQTT_BROKER;
export const username = process.env.REACT_APP_MQTT_USERNAME;
export const password = process.env.REACT_APP_MQTT_PASSWORD;

// MQTT Topics
export const commandTopic = process.env.REACT_APP_MQTT_TOPIC || "esp/buttons";
export const gpsTopic = process.env.REACT_APP_GPS_TOPIC || "rpi/gps";
export const grassHeightTopic = process.env.REACT_APP_GRASS_HEIGHT_TOPIC || "sensor/grass_height";

// Environmental data topic
export const environmentalTopic = "env/bme280";

// Leaflet Map Configuration
export const leafletConfig = {
  tileLayerUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri",
  defaultZoom: 18,
  defaultCenter: { lat: 52.720046, lng: 0.092452 }
};

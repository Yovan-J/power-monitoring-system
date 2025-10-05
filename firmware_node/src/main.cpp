#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "EmonLib.h" // Include the Energy Monitoring Library

// --- IMPORTANT: FILL IN YOUR DETAILS HERE ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER_IP = "YOUR_COMPUTER_IP_ADDRESS";
// -------------------------------------------

// --- PIN DEFINITIONS ---
// Define which GPIO pins your sensors will be connected to.
// These are common choices, but you can change them.
#define VOLTAGE_PIN 34
#define CURRENT_PIN 35

const int MQTT_BROKER_PORT = 1883;
const char* NODE_ID = "ESP32_NODE_01";
const char* MQTT_TOPIC = "campus/data/ESP32_NODE_01";

// Create instances for clients and the energy monitor
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
EnergyMonitor emon;

// Forward declarations for functions
void setup_wifi();
void reconnect_mqtt();

void setup() {
  Serial.begin(115200);
  setup_wifi();
  mqttClient.setServer(MQTT_BROKER_IP, MQTT_BROKER_PORT);

  // --- Initialize the Energy Monitor ---
  // The numbers are calibration values. We will fine-tune these later.
  // emon.voltage(VOLTAGE_PIN, VCAL, PHASECAL);
  // emon.current(CURRENT_PIN, ICAL);
  emon.voltage(VOLTAGE_PIN, 234.26, 1.7);
  emon.current(CURRENT_PIN, 111.1);
}

void loop() {
  if (!mqttClient.connected()) {
    reconnect_mqtt();
  }
  mqttClient.loop();

  // --- SENSOR READING LOGIC ---
  // This flag controls whether we use real sensor data or placeholder data.
  // Change to '#if 1' when you have your sensors connected.
#if 0 
  // --- REAL SENSOR CODE ---
  // Calculate all the values from the sensors
  emon.calcVI(20, 2000); 

  float realPower       = emon.realPower;        // Watts
  float apparentPower   = emon.apparentPower;    // VA
  float powerFactor     = emon.powerFactor;      // 0.0 - 1.0
  float supplyVoltage   = emon.Vrms;             // Volts
  float current         = emon.Irms;             // Amps
  float frequency       = 50.0; // EmonLib doesn't calculate frequency directly

#else
  // --- PLACEHOLDER CODE (if sensors are not connected) ---
  float realPower       = random(250, 400);
  float supplyVoltage   = 230.0 + (random(-5, 5) / 10.0);
  float current         = realPower / supplyVoltage;
  float powerFactor     = 0.95;
  float frequency       = 50.0;
#endif

  // --- Create and Publish JSON Payload ---
  JsonDocument doc;
  doc["node_id"] = NODE_ID;
  doc["timestamp"] = time(nullptr);
  doc["voltage"] = supplyVoltage;
  doc["current"] = current;
  doc["power"] = realPower;
  doc["power_factor"] = powerFactor;
  doc["frequency"] = frequency;

  String payload;
  serializeJson(doc, payload);

  Serial.print("Publishing message: ");
  Serial.println(payload);
  mqttClient.publish(MQTT_TOPIC, payload.c_str());

  delay(10000);
}

// --- Function Definitions ---
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect(NODE_ID)) {
      Serial.println("connected!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}


// redisClient.js
const redis = require("redis");

const client = redis.createClient();

client.on("error", (err) => console.error("Redis Client Error:", err));

client.connect().then(() => {
  console.log("[DEBUG] Connected to Redis");
});

module.exports = client;

// cleanupQueue.js
const fs = require("fs");
const redisClient = require("./redisClient");

const QUEUE_KEY = "cleanupQueue";

// Add a cleanup task to Redis.
// The task should be an object with: { type: "file" | "dir", path: "..." }
const addCleanupTask = async (task) => {
  console.debug("[DEBUG] Adding cleanup task to Redis queue:", task);
  await redisClient.rPush(QUEUE_KEY, JSON.stringify(task));
};

// Worker to process cleanup tasks from the Redis queue.
const processCleanupTasks = async () => {
  try {
    const taskString = await redisClient.lPop(QUEUE_KEY);
    if (taskString) {
      const task = JSON.parse(taskString);
      console.debug("[DEBUG] Processing cleanup task:", task);
      if (task.type === "file") {
        fs.unlink(task.path, (err) => {
          if (err) console.error("Error deleting file:", task.path, err);
          else console.debug("Successfully deleted file:", task.path);
        });
      } else if (task.type === "dir") {
        fs.rm(task.path, { recursive: true, force: true }, (err) => {
          if (err) console.error("Error deleting directory:", task.path, err);
          else console.debug("Successfully deleted directory:", task.path);
        });
      }
    }
  } catch (err) {
    console.error("Error processing cleanup tasks", err);
  }
};

// Process one task every 5 seconds.
setInterval(processCleanupTasks, 5000);

module.exports = {
  addCleanupTask,
};

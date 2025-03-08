// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { runCode } = require("./lib/codeRunner");
const openaiRoutes = require("./route/openaiRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());
// Mount the OpenAI code correction API under /openai
app.use("/openai", openaiRoutes);
app.post("/run", (req, res) => {
  console.debug("[DEBUG] Received request:", JSON.stringify(req.body));
  const { language, code } = req.body;
  if (!language || !code) {
    console.debug("[DEBUG] Missing language or code in request");
    return res.status(400).json({ error: "Missing data" });
  }
  runCode(language, code, res);
});

app.listen(5000, () => console.log("Server running on port 5000"));

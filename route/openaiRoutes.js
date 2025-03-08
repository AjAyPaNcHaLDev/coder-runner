// openaiRoutes.js
const express = require("express");
const router = express.Router();
const { correctCode } = require("../lib/openaiCorrector");

// POST endpoint: /correct
// Expects a JSON body with `language` and `code` fields.
router.post("/correct", async (req, res) => {
  const { language, code } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: "Missing language or code" });
  }
  
  try {
    const correctedCode = await correctCode(language, code);
    res.json({ correctedCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

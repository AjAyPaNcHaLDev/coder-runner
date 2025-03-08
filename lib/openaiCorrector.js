const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key set
});

/**
 * Corrects code by sending it to OpenAI with a prompt.
 * @param {string} language - The programming language (e.g., javascript, python, etc.)
 * @param {string} code - The code to be corrected
 * @returns {Promise<string>} - The corrected code
 */
async function correctCode(language, code) {
  const prompt = `Fix any bugs in the following ${language} code and return only the corrected code:\n\n${code}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Lower model for compatibility
      messages: [
        { role: "system", content: "You are an expert programmer. Fix any bugs in the provided code." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    throw new Error("Error calling OpenAI: " + error.message);
  }
}

module.exports = {
  correctCode,
};
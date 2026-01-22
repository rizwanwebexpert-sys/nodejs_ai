require('dotenv').config();
const PORT = process.env.PORT || 5000;

const app = require("./app");

//listen on given port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
const { clear } = require('console');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Optional OpenAI integration
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Simple response database
const responses = {
  'hello': 'Hello there! How can I help you today?',
  'what is the weather': 'I cannot check real-time weather, but you can check a weather website!',
  'tell me a joke': 'Why don\'t scientists trust atoms? Because they make up everything!',
  'goodbye': 'Goodbye! Have a great day!',
  'default': "I'm not sure how to respond to that. Can you ask something else?"
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  
  // Check for predefined responses
  if (responses[lowerMessage]) {
    return res.json({ response: responses[lowerMessage] });
  }
  
  // Use OpenAI if available
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful voice assistant. Keep responses brief and conversational." },
          { role: "user", content: message }
        ],
        max_tokens: 100
      });
      return res.json({ response: completion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI error:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }
  
  // Default response
  res.json({ response: responses['default'] });
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

// Create Groq client with API key
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/summarize', async (req, res) => {
  const { transcript, prompt } = req.body;
  try {
    const chatCompletion = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: `${prompt}\n${transcript}` }
      ]
    });
    const summary = chatCompletion.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

app.post('/send-email', async (req, res) => {
  const { summary, to } = req.body;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    }
  });
  let mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Meeting Summary',
    text: summary,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent!' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Add root route handler here
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

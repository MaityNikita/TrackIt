const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/media-diary', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Entry Schema
const entrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['movie', 'tv', 'book', 'game'] },
  releaseYear: String,
  creator: String,
  category: String,
  content: String,
  imageUrl: String,
  rating: { type: Number, min: 0, max: 10 },
  date: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

const Entry = mongoose.model('Entry', entrySchema);

// Routes
app.post('/api/entries', async (req, res) => {
  try {
    const entry = new Entry(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
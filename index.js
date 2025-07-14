
const express = require('express');
const mongoose = require('mongoose');
const ShortUniqueId = require('short-unique-id');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Fix: Use .rnd() method instead of calling uid as a function
const uid = new ShortUniqueId({ length: 6 });

app.use(cors());
app.use(express.json());

// MongoDB model
const Link = mongoose.model('Link', new mongoose.Schema({
  shortId: String,
  originalUrl: String,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// 🧪 Optional health check endpoint
app.get("/", (req, res) => {
  res.send("✅ Backend is working and CORS is active");
});

// POST: Create a short link
app.post('/shorten', async (req, res) => {
  const { url } = req.body;

  try {
    const shortId = uid.rnd(); // ✅ Fix: use .rnd()
    const link = new Link({ shortId, originalUrl: url });
    await link.save();
    res.json({ shortUrl: `${process.env.FRONTEND_URL}/ad/${shortId}` });
  } catch (error) {
    console.error("❌ Error in /shorten:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET: Redirect to ad page (optional — not used if frontend handles redirection)
app.get('/:shortId', async (req, res) => {
  const link = await Link.findOne({ shortId: req.params.shortId });
  if (!link) return res.status(404).send("Link not found");
  res.redirect(`${process.env.FRONTEND_URL}/ad/${req.params.shortId}`);
});

// GET: Get original URL (used in ad page)
app.get('/api/original/:shortId', async (req, res) => {
  const link = await Link.findOne({ shortId: req.params.shortId });
  if (!link) return res.status(404).json({ error: "Not found" });
  res.json({ url: link.originalUrl });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
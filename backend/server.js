require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./routes/auth');
const bookRoutes = require('./routes/bookRoutes')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', auth);
app.use('/api/books', bookRoutes);

// MongoDB kapcsolódás
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(process.env.PORT), console.log('MongoDB connected\nServer running on port 5000'))
  .catch((err) => console.error('MongoDB hiba:', err));

// Alapértelmezett útvonal
app.get('/', (req, res) => {
  res.send('Helló, Express!');
});

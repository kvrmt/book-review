require('dotenv').config(); //Érzékeny adatok a .env fájlban (Mongo DB autentikáció, port, JWT kulcs)
const express = require('express'); //Express server használatához
const mongoose = require('mongoose'); //Mongo DB használatához
const cors = require('cors'); //Frontend-Backend összekapcsoláshoz
const auth = require('./routes/auth');  //Importáljuk a auth-t a routes könyvtárból
const bookRoutes = require('./routes/bookRoutes');  //Importáljuk a bookRoutes-t a routes könyvtárból
const { swaggerUi, swaggerDocs } = require('./swagger/swagger');  // Importáljuk a Swagger beállítást

const app = express();

app.use(cors());
app.use(express.json());
//Felhasználókezelés/Könyvekkel kapcsolatos végpontok
app.use('/api/auth', auth);
app.use('/api/books',bookRoutes);
//Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// MongoDB kapcsolódás
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(process.env.PORT), console.log('MongoDB connected\nServer running on port 5000'))
  .catch((err) => console.error('MongoDB hiba:', err));

// Alapértelmezett útvonal
app.get('/', (req, res) => {
  res.send('Helló, Express!');
});
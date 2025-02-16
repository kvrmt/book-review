const express = require('express');
const Book = require('../models/Book'); // A könyv adatmodell importálása
const router = express.Router();

// Könyvek lekérése
router.get('/', async (req, res) => {
    try {
        const books = await Book.find(); // Az összes könyv lekérése az adatbázisból
        res.json({ books });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyvek lekérésekor.', error: err });
    }
});

// Könyv hozzáadása
router.post('/add', async (req, res) => {
    const { title, author, year, genre } = req.body;

    // Validáció
    if (!title || !author || !year || !genre) {
        return res.status(400).json({ message: 'Minden mezőt ki kell tölteni!' });
    }

    try {
        const newBook = new Book({ title, author, year, genre });
        await newBook.save();
        res.status(201).json({ message: 'Könyv sikeresen hozzáadva!', book: newBook });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyv hozzáadása közben.', error: err });
    }
});

module.exports = router;

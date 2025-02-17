const express = require('express');
const Book = require('../models/Book'); // A könyv adatmodell importálása
const jwt = require('jsonwebtoken');
const router = express.Router();

// Auth Middleware közvetlen implementálása
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Nincs érvényes token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Azonosítja a felhasználót
        req.user = decoded.user;  // A dekódolt információt eltesszük a req.user-be
        next();  // Folytatjuk a kérés kezelését
    } catch (err) {
        console.error('Hiba a token ellenőrzésekor:', err);
        res.status(401).json({ message: 'Érvénytelen token.' });
    }
};

// Könyvek lekérése
router.get('/', async (req, res) => {
    try {
        const books = await Book.find(); // Az összes könyv lekérése az adatbázisból
        res.json({ books });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyvek lekérésekor.', error: err });
    }
});

//Egy könyv lekérése
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById( req.params.id );
        if (!book) {
            return res.status(404).json({ message: 'A könyv nem található.' });
        }
        res.json({ book });
    } catch (err) {
        console.error('Hiba történt a könyv adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt a könyv adatainak lekérésekor.' });
    }
});

// Könyvek lekérése a bejelentkezett felhasználó által hozzáadott könyvekre
router.get('/my-books', authMiddleware, async (req, res) => {
    try {
        // Keresés a 'addedBy' mező alapján, hogy csak a bejelentkezett felhasználó könyveit hozza vissza
        const books = await Book.find({ addedBy: req.user.id });

        if (books.length===0) {
            return res.status(202).json({ message: 'Nincsenek könyvek a listán.' });
        }

        res.json({ books });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyvek lekérésekor.', error: err });
    }
});

// Könyv hozzáadása
router.post('/add', authMiddleware, async (req, res) => {
    const { title, author, year, genre } = req.body;

    // Validáció
    if (!title || !author || !year || !genre) {
        return res.status(400).json({ message: 'Minden mezőt ki kell tölteni!' });
    }

    // A bejelentkezett felhasználó ID-ja (req.user a middleware-ből)
    const addedBy = req.user.id;  // Az ID az authentikált felhasználóhoz tartozik

    try {
        const newBook = new Book({ title, author, year, genre, addedBy, });
        await newBook.save();
        res.status(201).json({ message: 'Könyv sikeresen hozzáadva!', book: newBook });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyv hozzáadása közben.', error: err });
    }
});

// Könyv törlése (csak a saját könyveit törölheti a felhasználó)
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, addedBy: req.user.id });

        if (!book) {
            return res.status(403).json({ message: 'Nincs jogosultságod törölni ezt a könyvet.' });
        }

        await Book.deleteOne({ _id: req.params.id });
        res.json({ message: 'Könyv sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a könyv törlésekor.' });
    }
});

//Könyv módosítása (csak a saját könyveit módosíthatja a felhasználó)
router.put('/edit/:id', authMiddleware, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, addedBy: req.user.id });

        if (!book) {
            return res.status(403).json({ message: 'Nincs jogosultságod módosítani ezt a könyvet.' });
        }

        // A könyv adatai frissítése a beérkező adatokkal
        const { title, author, year, genre } = req.body;

        if (title) book.title = title;
        if (author) book.author = author;
        if (year) book.year = year;
        if (genre) book.genre = genre;

        // A módosított könyv mentése
        await book.save();

        res.json({ message: 'Könyv sikeresen módosítva.', book });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyv módosítása közben.', error: err });
    }
});

module.exports = router;

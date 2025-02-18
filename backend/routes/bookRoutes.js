const express = require('express');
const Book = require('../models/Book'); // A könyv adatmodell importálása
const Review = require('../models/Review');  // A Review modell importálása
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
router.get('/', authMiddleware, async (req, res) => {
    try {
        const books = await Book.find(); // Az összes könyv lekérése az adatbázisból
        const userId = req.user ? req.user.id : null; // Bejelentkezett felhasználó ID-je

        // Az értékelések átlagának kiszámítása minden könyv esetén
        const booksWithDetails = await Promise.all(books.map(async (book) => {
            const reviews = await Review.find({ bookId: book._id });

            // Átlagos értékelés kiszámítása
            let averageRating = 0;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                averageRating = totalRating / reviews.length;
            }

            // Ellenőrizzük, hogy a bejelentkezett felhasználó értékelte-e már ezt a könyvet
            const userReview = userId ? await Review.findOne({ bookId: book._id, userId }) : null;

            return {
                ...book.toObject(),
                averageRating,  // Az átlag hozzáadása a könyvhöz
                userHasReviewed: !!userReview, // True, ha a felhasználó már értékelt
            };
        }));

        res.json({ books: booksWithDetails });
    } catch (err) {
        console.error('Hiba történt a könyvek lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt a könyvek lekérésekor.', error: err });
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

// Értékelések lekérése a bejelentkezett felhasználó által
router.get('/my-reviews', authMiddleware, async (req, res) => {
    try {
        // Keresés a 'addedBy' mező alapján, hogy csak a bejelentkezett felhasználó értékeléseit hozza vissza
        const reviews = await Review.find({ userId: req.user.id });
        if (reviews.length===0) {
            return res.status(202).json({ message: 'Nincsenek értékelések a listán.' });
        }

        // Az összes könyv ID-t kiszedjük és lekérjük a könyveket
        const bookIds = reviews.map(review => review.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        const reviewsWithBookNames = reviews.map(review => {
            const book = books.find(book => book._id.toString() === review.bookId.toString());
            return {
                ...review.toObject(),
                bookTitle: book ? book.title : 'Ismeretlen könyv'  // Ha nincs könyv, akkor "Ismeretlen könyv"
            };
        });

        res.json({ reviews: reviewsWithBookNames });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt az értékelések lekérésekor.', error: err });
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

// Értékelés törlése (csak a saját értékelését törölheti a felhasználó)
router.delete('/delete-review/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, userId: req.user.id });

        if (!review) {
            return res.status(403).json({ message: 'Nincs jogosultságod törölni ezt az értékelést.' });
        }

        await Review.deleteOne({ _id: req.params.id });
        res.json({ message: 'Értékelés sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt az értékelés törlésekor.' });
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

//Review módosítása (csak a saját review-kat módosíthatja a felhasználó)
router.put('/edit-review/:id', authMiddleware, async (req, res) => {
    try {
        const review_ = await Review.findOne({ _id: req.params.id, userId: req.user.id });

        if (!review_) {
            return res.status(403).json({ message: 'Nincs jogosultságod módosítani ezt az értékelést.' });
        }

        // Az értékelés adatai frissítése a beérkező adatokkal
        const { rating, review } = req.body;

        if (rating) review_.rating = rating;
        if (review) review_.review = review;

        // A módosított könyv mentése
        await review_.save();

        res.json({ message: 'Értékelés sikeresen módosítva.', review_ });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt az értékelés módosítása közben.', error: err });
    }
});

// Könyv értékelése (új dokumentumként rögzítve)
router.post('/add-review/:id', authMiddleware, async (req, res) => {
    const { rating, review } = req.body;

    if (!rating || !review) {
        return res.status(400).json({ message: 'Minden mezőt ki kell tölteni!' });
    }

    try {
        // A könyv ID-jának ellenőrzése
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'A könyv nem található.' });
        }

        // Új értékelés létrehozása
        const newReview = new Review({
            rating,
            review,
            userId: req.user.id,  // A bejelentkezett felhasználó ID-ja
            bookId: req.params.id,  // A könyv ID-ja
        });
        // Értékelés mentése
        await newReview.save();
        res.status(201).json({ message: 'Könyv értékelése sikeresen hozzáadva!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Hiba történt az értékelés hozzáadása közben.', error: err });
    }
});

//Egy review lekérése
router.get('/review/:id', async (req, res) => {
    try {
        const review = await Review.findById( req.params.id );
        if (!review) {
            return res.status(404).json({ message: 'Az értékelés nem található.' });
        }
        res.json({ review });
    } catch (err) {
        console.error('Hiba történt az értékelés adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt az értékelés adatainak lekérésekor.' });
    }
});

//Könyv review-k lekérése
router.get('/reviews/:id', async (req, res) => {
    try {
        // A könyv lekérése
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'A könyv nem található.' });
        }
        const bookTitle=book.title;

        const reviews = await Review.find( { bookId: req.params.id } );
        res.json({ reviews, bookTitle });
    } catch (err) {
        console.error('Hiba történt az értékelések adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt az értékelések adatainak lekérésekor.' });
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

module.exports = router;

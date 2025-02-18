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
// Könyvek lekérése endpoint
/**
 * @swagger
 * /books:
 *   get:
 *     summary: "Könyvek lekérése"
 *     description: "Visszaadja az összes könyvet az adatbázisból, beleértve az átlagos értékelést és azt, hogy a bejelentkezett felhasználó értékelte-e már a könyvet."
 *     tags:
 *       - "Books"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "A könyvek sikeresen vissza lettek adva"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       averageRating:
 *                         type: number
 *                         format: float
 *                       userHasReviewed:
 *                         type: boolean
 *       500:
 *         description: "Hiba történt a könyvek lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const books = await Book.find(); // Az összes könyv lekérése az adatbázisból
        const userId = req.user ? req.user.id : null; // Bejelentkezett felhasználó ID-je

        // Az értékelések átlagának kiszámítása minden könyv esetén
        const booksWithDetails = await Promise.all(books.map(async (book) => {
            const reviews = await Review.find({ bookId: book._id }); //Könyvhöz tartozó értékelések lekérése

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
/**
 * @swagger
 * /books/my-books:
 *   get:
 *     summary: "Könyvek lekérése a bejelentkezett felhasználó által hozzáadott könyvekre"
 *     description: "Visszaadja a bejelentkezett felhasználó által hozzáadott könyveket. Ha a felhasználó nem adott hozzá könyvet, akkor üzenetet küld."
 *     tags:
 *       - "Books"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "A könyvek sikeresen vissza lettek adva"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       addedBy:
 *                         type: string
 *       202:
 *         description: "A felhasználó nem adott hozzá könyvet."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: "Hiba történt a könyvek lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
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
/**
 * @swagger
 * /books/my-reviews:
 *   get:
 *     summary: "A bejelentkezett felhasználó értékeléseinek lekérése"
 *     description: "Visszaadja a bejelentkezett felhasználó által írt értékeléseket, beleértve a könyvcímeket is."
 *     tags:
 *       - "Reviews"
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "Az értékelések sikeresen vissza lettek adva"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       bookId:
 *                         type: string
 *                       rating:
 *                         type: number
 *                         format: float
 *                       comment:
 *                         type: string
 *                       bookTitle:
 *                         type: string
 *       202:
 *         description: "A felhasználó nem adott még értékelést."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: "Hiba történt az értékelések lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
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
/**
 * @swagger
 * /books/add:
 *   post:
 *     summary: "Új könyv hozzáadása"
 *     description: "A bejelentkezett felhasználó új könyvet adhat hozzá az adatbázishoz."
 *     tags:
 *       - "Books"
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - year
 *               - genre
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Példa könyv"
 *               author:
 *                 type: string
 *                 example: "John Doe"
 *               year:
 *                 type: integer
 *                 example: 2024
 *               genre:
 *                 type: string
 *                 example: "Sci-Fi"
 *     responses:
 *       201:
 *         description: "A könyv sikeresen hozzáadva."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 book:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     year:
 *                       type: integer
 *                     genre:
 *                       type: string
 *                     addedBy:
 *                       type: string
 *       400:
 *         description: "Hiányzó mezők esetén hibaüzenetet ad vissza."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: "Hiba történt a könyv hozzáadása közben."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post('/add', authMiddleware, async (req, res) => {
    const { title, author, year, genre } = req.body;

    // Validáció
    if (!title || !author || !year || !genre) {
        return res.status(400).json({ message: 'Minden mezőt ki kell tölteni!' });
    }

    // A bejelentkezett felhasználó ID-ja (req.user a middleware-ből)
    const addedBy = req.user.id;  // Az ID az authentikált felhasználóhoz tartozik

    try {
        const newBook = new Book({ title, author, year, genre, addedBy, });//Könyv létrehozása
        await newBook.save();//Könyv mentése az adatbázisba
        res.status(201).json({ message: 'Könyv sikeresen hozzáadva!', book: newBook });
    } catch (err) {
        res.status(500).json({ message: 'Hiba történt a könyv hozzáadása közben.', error: err });
    }
});

// Könyv törlése, és a hozzá kapcsoldó értékelések törlése (csak a saját könyveit törölheti a felhasználó)
/**
 * @swagger
 * /books/delete/{id}:
 *   delete:
 *     summary: "Könyv törlése"
 *     description: "A bejelentkezett felhasználó törölheti a saját hozzáadott könyveit és azok értékeléseit."
 *     tags:
 *       - "Books"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A törlendő könyv azonosítója"
 *     responses:
 *       200:
 *         description: "A könyv és az értékelései sikeresen törölve."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Könyv sikeresen törölve."
 *       403:
 *         description: "A felhasználónak nincs jogosultsága a könyv törlésére."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nincs jogosultságod törölni ezt a könyvet."
 *       500:
 *         description: "Hiba történt a könyv törlésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt a könyv törlésekor."
 */
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, addedBy: req.user.id });//Könyv megkeresése

        if (!book) {//Ha nem a felhasznál hozta létre véletlen
            return res.status(403).json({ message: 'Nincs jogosultságod törölni ezt a könyvet.' });
        }
        //Könyv törlése
        await Book.deleteOne({ _id: req.params.id });
        //Értékeléseinek törlése
        await Review.deleteMany({ bookId: req.params.id });
        res.json({ message: 'Könyv sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt a könyv törlésekor.' });
    }
});

// Értékelés törlése (csak a saját értékelését törölheti a felhasználó)
/**
 * @swagger
 * /books/delete-review/{id}:
 *   delete:
 *     summary: "Értékelés törlése"
 *     description: "A bejelentkezett felhasználó törölheti a saját értékelését."
 *     tags:
 *       - "Reviews"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A törlendő értékelés azonosítója"
 *     responses:
 *       200:
 *         description: "Az értékelés sikeresen törölve."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Értékelés sikeresen törölve."
 *       403:
 *         description: "A felhasználónak nincs jogosultsága az értékelés törlésére."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nincs jogosultságod törölni ezt az értékelést."
 *       500:
 *         description: "Hiba történt az értékelés törlésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt az értékelés törlésekor."
 */
router.delete('/delete-review/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, userId: req.user.id });//Értékelés megkeresése

        if (!review) {//Ha nem a felhasználó hozta létre az értékelést véletlen
            return res.status(403).json({ message: 'Nincs jogosultságod törölni ezt az értékelést.' });
        }

        await Review.deleteOne({ _id: req.params.id });//Törlés az adatbázisból
        res.json({ message: 'Értékelés sikeresen törölve.' });
    } catch (error) {
        res.status(500).json({ message: 'Hiba történt az értékelés törlésekor.' });
    }
});

//Könyv módosítása (csak a saját könyveit módosíthatja a felhasználó)
/**
 * @swagger
 * /books/edit/{id}:
 *   put:
 *     summary: "Könyv módosítása"
 *     description: "A bejelentkezett felhasználó módosíthatja a saját hozzáadott könyveit."
 *     tags:
 *       - "Books"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A módosítandó könyv azonosítója"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Módosított könyvcím"
 *               author:
 *                 type: string
 *                 example: "Módosított szerző"
 *               year:
 *                 type: integer
 *                 example: 2024
 *               genre:
 *                 type: string
 *                 example: "Sci-Fi"
 *     responses:
 *       200:
 *         description: "A könyv sikeresen módosítva."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Könyv sikeresen módosítva."
 *                 book:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     author:
 *                       type: string
 *                     year:
 *                       type: integer
 *                     genre:
 *                       type: string
 *       403:
 *         description: "A felhasználónak nincs jogosultsága a könyv módosítására."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nincs jogosultságod módosítani ezt a könyvet."
 *       500:
 *         description: "Hiba történt a könyv módosítása közben."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt a könyv módosítása közben."
 */
router.put('/edit/:id', authMiddleware, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, addedBy: req.user.id });//Könyv megkeresése

        if (!book) {//Nem a felhasználó könyve véletlen
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
/**
 * @swagger
 * /books/edit-review/{id}:
 *   put:
 *     summary: "Értékelés módosítása"
 *     description: "A bejelentkezett felhasználó módosíthatja a saját értékeléseit."
 *     tags:
 *       - "Reviews"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A módosítandó értékelés azonosítója"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               review:
 *                 type: string
 *                 example: "Nagyon tetszett a könyv!"
 *     responses:
 *       200:
 *         description: "Az értékelés sikeresen módosítva."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Értékelés sikeresen módosítva."
 *                 review_:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                     review:
 *                       type: string
 *       403:
 *         description: "A felhasználónak nincs jogosultsága az értékelés módosítására."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nincs jogosultságod módosítani ezt az értékelést."
 *       500:
 *         description: "Hiba történt az értékelés módosítása közben."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt az értékelés módosítása közben."
 */
router.put('/edit-review/:id', authMiddleware, async (req, res) => {
    try {
        const review_ = await Review.findOne({ _id: req.params.id, userId: req.user.id });//Értékelés megkeresése

        if (!review_) {//Ha nem a felhasználóhoz tartozik véletlen
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

// Könyv értékelés rögzítése
/**
 * @swagger
 * /books/add-review/{id}:
 *   post:
 *     summary: "Új értékelés hozzáadása egy könyvhöz"
 *     description: "A bejelentkezett felhasználó egy új értékelést adhat egy könyvhöz."
 *     tags:
 *       - "Reviews"
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Az értékelt könyv azonosítója"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               review:
 *                 type: string
 *                 example: "Nagyon jó könyv, ajánlom mindenkinek!"
 *     responses:
 *       201:
 *         description: "Az értékelés sikeresen hozzáadva."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Könyv értékelése sikeresen hozzáadva!"
 *       400:
 *         description: "Hiányzó mezők az értékelés beküldésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Minden mezőt ki kell tölteni!"
 *       404:
 *         description: "A könyv nem található."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A könyv nem található."
 *       500:
 *         description: "Hiba történt az értékelés hozzáadása közben."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt az értékelés hozzáadása közben."
 */
router.post('/add-review/:id', authMiddleware, async (req, res) => {
    const { rating, review } = req.body;//Felhasználó értékelésének adatai

    if (!rating || !review) {//Ha hiányos az adatok
        return res.status(400).json({ message: 'Minden mezőt ki kell tölteni!' });
    }

    try {
        // A könyv ID-jának ellenőrzése
        const book = await Book.findById(req.params.id);//Könyv lekérése
        if (!book) {//Ha nem létezne
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
/**
 * @swagger
 * /books/review/{id}:
 *   get:
 *     summary: "Egy adott értékelés lekérése"
 *     description: "Lekéri az adott értékelés adatait az azonosító alapján."
 *     tags:
 *       - "Reviews"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Az értékelés azonosítója"
 *     responses:
 *       200:
 *         description: "Az értékelés adatai sikeresen lekérve."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65f0aef3c4a6d03b2e5d1234"
 *                     userId:
 *                       type: string
 *                       example: "65f0aef3c4a6d03b2e5d5678"
 *                     bookId:
 *                       type: string
 *                       example: "65f0aef3c4a6d03b2e5d9101"
 *                     rating:
 *                       type: integer
 *                       example: 4
 *                     review:
 *                       type: string
 *                       example: "Nagyon jó könyv, ajánlom!"
 *       404:
 *         description: "Az értékelés nem található."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Az értékelés nem található."
 *       500:
 *         description: "Hiba történt az értékelés adatainak lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt az értékelés adatainak lekérésekor."
 */
router.get('/review/:id', async (req, res) => {
    try {
        const review = await Review.findById( req.params.id );//Értékelés megkeresése
        if (!review) {//Ha nem létezne
            return res.status(404).json({ message: 'Az értékelés nem található.' });
        }
        res.json({ review });//Vissza adjuk az értékelést
    } catch (err) {
        console.error('Hiba történt az értékelés adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt az értékelés adatainak lekérésekor.' });
    }
});

//Könyv értékelésekk lekérése
/**
 * @swagger
 * /books/reviews/{id}:
 *   get:
 *     summary: "Egy adott könyv értékeléseinek lekérése"
 *     description: "Lekéri az adott könyv összes értékelését és annak címét."
 *     tags:
 *       - "Reviews"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A könyv azonosítója"
 *     responses:
 *       200:
 *         description: "A könyv értékelései sikeresen lekérve."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookTitle:
 *                   type: string
 *                   example: "A Gyűrűk Ura"
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65f0aef3c4a6d03b2e5d1234"
 *                       userId:
 *                         type: string
 *                         example: "65f0aef3c4a6d03b2e5d5678"
 *                       bookId:
 *                         type: string
 *                         example: "65f0aef3c4a6d03b2e5d9101"
 *                       rating:
 *                         type: integer
 *                         example: 5
 *                       review:
 *                         type: string
 *                         example: "Fantasztikus történet, imádtam!"
 *       404:
 *         description: "A könyv nem található."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A könyv nem található."
 *       500:
 *         description: "Hiba történt az értékelések adatainak lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt az értékelések adatainak lekérésekor."
 */
router.get('/reviews/:id', async (req, res) => {
    try {
        // A könyv lekérése
        const book = await Book.findById(req.params.id);
        if (!book) {//Ha nem lenne meg
            return res.status(404).json({ message: 'A könyv nem található.' });
        }
        const bookTitle=book.title;//Könyv címe kell nekünk csak most, ezzel egészül ki a válasz

        const reviews = await Review.find( { bookId: req.params.id } );//Értékelés lekérése a db-ból
        res.json({ reviews, bookTitle });//Vissza adjuk a kiegészített értékelést a könyv nevével
    } catch (err) {
        console.error('Hiba történt az értékelések adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt az értékelések adatainak lekérésekor.' });
    }
});

//Egy könyv lekérése
/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: "Egy adott könyv adatainak lekérése"
 *     description: "Lekéri egy adott könyv adatait az ID alapján."
 *     tags:
 *       - "Books"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "A könyv azonosítója"
 *     responses:
 *       200:
 *         description: "A könyv adatai sikeresen lekérve."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 book:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65f0aef3c4a6d03b2e5d9101"
 *                     title:
 *                       type: string
 *                       example: "A Gyűrűk Ura"
 *                     author:
 *                       type: string
 *                       example: "J.R.R. Tolkien"
 *                     year:
 *                       type: integer
 *                       example: 1954
 *                     genre:
 *                       type: string
 *                       example: "Fantasy"
 *       404:
 *         description: "A könyv nem található."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A könyv nem található."
 *       500:
 *         description: "Hiba történt a könyv adatainak lekérésekor."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hiba történt a könyv adatainak lekérésekor."
 */
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById( req.params.id );//Lekéri azt az egy könyvet az egyedi azonosítója alapján
        if (!book) {//Ha nincs meg véletlen
            return res.status(404).json({ message: 'A könyv nem található.' });
        }
        res.json({ book });//Vissza adjuk a könyvet
    } catch (err) {
        console.error('Hiba történt a könyv adatainak lekérésekor:', err);
        res.status(500).json({ message: 'Hiba történt a könyv adatainak lekérésekor.' });
    }
});

module.exports = router;

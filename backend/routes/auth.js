const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Regisztráció
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: "Felhasználó regisztrációja"
 *     description: "A felhasználó regisztrációja a felhasználónév és jelszó megadásával."
 *     tags:
 *       - "Auth"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newuser123"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: "Sikeres regisztráció, token visszaküldve"
 *       400:
 *         description: "Hiányzó mezők vagy létező felhasználó"
 *       500:
 *         description: "Hiba történt a regisztráció során"
 */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;//Lekérjük a megadott adatokat
    if (!username || !password) {//Ha nem lenne kitöltve
        return res.status(400).json({ msg: 'Kérjük, töltsd ki mindkét mezőt!' });
    }
    try {//Ha létezne a felhasználónév
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Létező felhasználó' });
        }

        user = new User({ username, password });//Létrehozzuk a felhasználót
        await user.save();//Tároljuk

        const payload = { user: { id: user.id } };//titkosítva (aláírva) küldünk a felhasználónak a tokenben, hiszen regisztráció után be is jelenkeztetjük
        //JWT aláírás, titkosítási kulccsal, és 1 órás érvényességgel
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Bejelentkezés
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: "Bejelentkezés felhasználói fiókba"
 *     description: "A felhasználó bejelentkezéséhez szükséges a felhasználónév és a jelszó. Ha a hitelesítés sikeres, akkor egy JWT token kerül visszaadásra."
 *     tags:
 *       - "Auth"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: "A felhasználó neve"
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 description: "A felhasználó jelszava"
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: "Sikeres bejelentkezés, JWT token visszaküldése."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: "A visszaküldött JWT token"
 *       400:
 *         description: "Hibás felhasználónév vagy jelszó"
 *       500:
 *         description: "Szerver oldali hiba"
 */

router.post('/login', async (req, res) => {
    const { username, password } = req.body;//Lekérjük a megadott adatokat
    try {//Ha nem találjuk a felhasználnevet
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Nem regisztrált felhasználónév' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {//Ha megvan a felhasználó, de nem jó a jelszó
            return res.status(400).json({ msg: 'Hibás Jelszó' });
        }

        const payload = { user: { id: user.id } };//titkosítva (aláírva) küldünk a felhasználónak a tokenben
        //JWT aláírás, titkosítási kulccsal, és 1 órás érvényességgel
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
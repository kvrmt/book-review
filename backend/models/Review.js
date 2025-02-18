const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },  // Az értékelés pontszáma
    review: { type: String, required: true },  // A vélemény
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },  // A felhasználó ID-ja
    bookId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Book' },  // A könyv ID-ja
    createdAt: { type: Date, default: Date.now },  // Az értékelés létrehozásának/módosításának ideje
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
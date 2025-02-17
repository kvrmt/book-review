const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    addedBy: {type: mongoose.Schema.Types.ObjectId, required: true},
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;

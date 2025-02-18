const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },//Cím
    author: { type: String, required: true },//Szerző
    year: { type: Number, required: true },//Év
    genre: { type: String, required: true },//Műfaj
    addedBy: {type: mongoose.Schema.Types.ObjectId, required: true},//Hozááadó felhasználó ID-ja
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;

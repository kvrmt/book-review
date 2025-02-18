const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },//Felhasználónév, egyedi, és kötelező
    password: {
        type: String,
        required: true,
    },//Jelszó, kötelező elem
});
//Titkosítás
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
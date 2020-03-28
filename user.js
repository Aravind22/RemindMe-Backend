const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
});

const user = mongoose.model('user', UserSchema);
module.exports = { user }
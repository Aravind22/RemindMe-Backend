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
    },
    number: {
        type: String,
        required: true,
        minlength: 10
    },
    reminders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'remainder' }]
});

const reminderSchema = mongoose.Schema({
    creator: String,
    date: String,
    message: [{type: String}]
})

const scheduleSchema = mongoose.Schema({
    date: String,
    users: [{type: String}]
})

const bcrypt = require('bcrypt');
let SALT = 10;

UserSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        bcrypt.genSalt(SALT, function(err, salt) {
            if(err) return next(err);

            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err);
                user.password = hash;
                next();
            })
        })
    } else {
        next()
    }
})

UserSchema.methods.comparePassword = function(userpass, check){
    bcrypt.compare(userpass, this.password, function(err, isMatch){
        if(err) return check(err)
        check(null, isMatch)
    })
}
const remainder = mongoose.model('remainder', reminderSchema)
const user = mongoose.model('user', UserSchema);
const schedular = mongoose.model('schedular', scheduleSchema)
module.exports = { user, remainder, schedular }
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
    reminders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'remainder' }],
    capsules:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'capsulesc' }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
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

const capsuleSchema = mongoose.Schema({
    type: Boolean,
    status: Boolean
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

UserSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({email:user.email}, process.env.JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token;
}

const remainder = mongoose.model('remainder', reminderSchema)
const user = mongoose.model('user', UserSchema);
const schedular = mongoose.model('schedular', scheduleSchema)
const capsuleSc = mongoose.model('capsulesc', capsuleSchema)
module.exports = { user, remainder, schedular, capsuleSc }
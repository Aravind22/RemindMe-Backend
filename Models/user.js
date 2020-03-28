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


const bcrypt = require('bcrypt');
const SALT = 10;

UserSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        bcrypt.genSalt(SALT, function(err, salt){
            if (err) return next(err)
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
})

UserSchema.methods.comparePassword = function(fnpasswd, checkpassword){
    bcrypt.compare(fnpasswd, this.password, function(err, isMatch) {
        if(err) return checkpassword(err)
        checkpassword(null, isMatch)
    })
}


const user = mongoose.model('user', UserSchema);
module.exports = { user }
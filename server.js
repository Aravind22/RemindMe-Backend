const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');

const DB_URI = "mongodb+srv://atlas:exYkcAnTSR0FPpOh@alpha-2vz7i.mongodb.net/test?retryWrites=true&w=majority";

const app = express();
const { user } = require('./Models/user')

mongoose.connect(DB_URI)
.then(() => {console.log("DB Connected")})
.catch(error => console.log(error));

app.use(bodyparser.json());

app.post('/api/user/signup', (req, res) => {
    const user_new = new user({
        email: req.body.email,
        password: req.body.password
    }).save((err, response) => {
        if(err) res.status(400).send(err)
        res.status(200).send(response);
    })
})

app.post('/api/user/signin', (req,res) => {
    user.findOne({'email':req.body.email}, (err,user) => {
        if(!user) res.json({message: 'Login Failed! User not found'})

        user.comparePassword(req.body.password, function(err, isMatch){
            if(err) throw err
            if(!isMatch) return res.status(400).json({message:'Wrong password'});
            res.status(200).send('Logged in successfully');
        })
    })
})

const port = process.env.PORT || 4000;
app.listen(port, ()=> {
    console.log('Server deployed on port:' + port);
})
const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');

// const DB_URI = "mongodb+srv://atlas:exYkcAnTSR0FPpOh@alpha-2vz7i.mongodb.net/test?retryWrites=true&w=majority";
const DB_URI = "mongodb://atlas:exYkcAnTSR0FPpOh@alpha-shard-00-00-2vz7i.mongodb.net:27017,alpha-shard-00-01-2vz7i.mongodb.net:27017,alpha-shard-00-02-2vz7i.mongodb.net:27017/test?ssl=true&replicaSet=Alpha-shard-0&authSource=admin&retryWrites=true&w=majority";

const cors = require('cors');
const app = express();
app.use(cors())
const { user } = require('./user')

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
            if(err) return err
            if(!isMatch) res.status(200).json({message:'Wrong password'});
            else res.status(200).json({message:'Logged in Successfully'});
        })
    })
})

const port = process.env.PORT || 4000;
app.listen(port, ()=> {
    console.log('Server deployed on port:' + port);
})
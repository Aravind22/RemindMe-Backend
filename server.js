// const DB_URI = "mongodb+srv://atlas:exYkcAnTSR0FPpOh@alpha-2vz7i.mongodb.net/test?retryWrites=true&w=majority";
const DB_URI = "mongodb://atlas:exYkcAnTSR0FPpOh@alpha-shard-00-00-2vz7i.mongodb.net:27017,alpha-shard-00-01-2vz7i.mongodb.net:27017,alpha-shard-00-02-2vz7i.mongodb.net:27017/test?ssl=true&replicaSet=Alpha-shard-0&authSource=admin&retryWrites=true&w=majority";

const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const cron = require('node-cron')
const cors = require('cors');
const moment = require('moment');

const app = express();
const { user, remainder, schedular } = require('./user')

mongoose.connect(DB_URI, {useNewUrlParser: true})
.then(() => {console.log("DB Connected")})
.catch(error => console.log(error));

app.use(bodyparser.json());
app.use(cors())

app.post('/api/user/signup', (req, res) => {
    const user_new = new user({
        email: req.body.email,
        password: req.body.password
    }).save((err, response) => {
        if(err) res.status(400).send(err)
        res.status(200).json({message: 'User created successfully'});
    })
})

app.post('/api/user/signin', (req,res) => {
    user.findOne({'email':req.body.email}, (err,user) => {
        if(err) res.status(200).json({message: 'User not registered'})
        if(!user) res.json({message: 'Login Failed! User not found'})
        user.comparePassword(req.body.password, function(err, isMatch){
            if(err) return err
            if(!isMatch) res.status(200).json({message:'Wrong password'});
            else res.status(200).json({message:'Logged in Successfully'});
        })
    })
})

app.post('/api/:user/get_reminders', (req, res) => {
    date_arr = []
    msg_arr = []
    msg_temp = []
    counter = 0;
    user.findOne({'email': req.params.user}, (err, usr) => {
        if(err) res.status(400).json({message: "Some error occured in getting reminders"})
        reminders_array = usr.reminders
        console.log(usr.reminders)
        if(usr.reminders.length > 0){
            const forLoop = async _ => {
                for(i=0;i<reminders_array.length;i++){
                    remainder.findOne({'_id': reminders_array[i]}, (err, rem_obj) => {
                        if(err) res.status(200).json({message: "some error occured in getting reminerds id"})
                        date_arr.push(rem_obj.date)
                        msg_arr.push(rem_obj.message)
                        if(date_arr.length == reminders_array.length - 1 || reminders_array.length == 1){
                            setTimeout(function () {
                                res.status(200).json({date: date_arr, message: msg_arr})
                              }, 2000)
                        }
                        counter++;
                    })
                }
            }
            forLoop();
        }else {
            res.status(200).json({message: "No reminders found!"})
        }
    })
})

app.post('/api/:user/add_date', (req, res) => {
    user.findOne({'email': req.params.user}, (err, usr) => {
        if(err) res.status(200).json({message: 'user not found in database'})
        if(!usr) res.status(200).json({message: 'user not registered'})

        remainder.find({'creator' : usr.email, 'date': req.body.date}, (err, reminder) => {
            if(err) res.status(400).json("some error occured in reminder object")
            if(reminder.length > 0){
                if(reminder[0].date == req.body.date){
                    reminder[0].message.push(req.body.message)
                    reminder[0].save()
                }
            } else {
                let remObj = new remainder()
                remObj.creator = req.params.user
                remObj.date = req.body.date
                remObj.message.push(req.body.message)
                remObj.save();
                usr.reminders.push(remObj)
                usr.save()
            }
        })
        updateSchedularList(usr, req)
        res.json({message: 'Reminder updated'})
    })
})

function updateSchedularList(user, req){
    schedular.findOne({'date': req.body.date}, (err, schedule) => {
        if(err) res.status(400).json({message: 'error in schedualar object'})
        if(schedule){
            var userArr = schedule.users
            userArr.indexOf(user.email) === -1 ? userArr.push(user.email) : console.log("user already exists")
            schedule.save();
        } else {
            schedule = new schedular()
            schedule.date = req.body.date,
            schedule.users.push(user.email)
            schedule.save();
        }
    })
}

// cron.schedule("* * * * * *", function(){
//     runSchedular();
// });

function runSchedular(){
    var i;
    var today = moment().format('DD/MM')
    schedular.findOne({'date': today}, (err, schObj) => {
        if(err) console.log("No schedulers for today")
        if(schObj){
            userArr = schObj.users
            for(i=0;i<userArr.length;i++){
                user.findOne({'email': userArr[i]}, (err, userObj) => {
                    remArr = userObj.reminders
                    for(i=0;i<remArr.length;i++){
                        remainder.findOne({'_id': remArr[i]}, (err, remObj) => {
                            if(remObj.date == today){
                                msgArr = remObj.message
                                for(i=0;i<msgArr.length;i++){
                                    notifyUser(userObj.email, msgArr[i])
                                }
                            }
                        })
                    }
                })
            }
        }
    })
}

function notifyUser(email, msg){
    console.log("Notified " + email + " with " + msg)
}



// app.post('/api/:user/add_date', async (req,res) => {
//     const userObj = await user.find({email: req.params.user})
//     var msg = ['secret', 'second']
//     try{
//         await user.updateOne({$set: {'message' : msg}}, function(err, res){
//             console.log(res)
//         });
//         await res.status(200).send(await user.find({email: "admin"}));
//     }catch(err){
//         console.log(err);
//     }
// })




const port = process.env.PORT || 4000;
app.listen(port, ()=> {
    console.log('Server deployed on port:' + port);
})
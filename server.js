//                  
//  
//      Uncomment the send message method before deployment
// 
// 
require("dotenv").config();
const express = require('express');
const bodyparser = require('body-parser');
const cron = require('node-cron')
const cors = require('cors');
const moment = require('moment');
const http = require('http')
const auth = require('./middleware/auth')
require('./db/db')

const app = express();
const { user, remainder, schedular, capsuleSc } = require('./model/user')

app.use(bodyparser.json());
app.use(cors())

app.post('/api/user/signup', async (req, res) => {
    const capsule = new capsuleSc()
    capsule.type = true
    capsule.status = false
    capsule.save()
    const user_new = new user({
        email: req.body.email,
        password: req.body.password,
        number: req.body.number,
        capsules : capsule
    })
    const token = await user_new.generateAuthToken()
    user_new.save((err, response) => {
        if(err) res.status(400).send(err)
        if(response){
            res.status(200).json({message: 'User created successfully'});
        }
    })
})

app.post('/api/user/signin', (req,res) => {
    user.findOne({'email':req.body.email}, (err,usr) => {
        if(err) res.status(200).json({message: 'User not registered'})
        if(!usr) res.json({message: 'Login Failed! User not found'})
        usr.comparePassword(req.body.password, async function(err, isMatch){
            if(err) return err
            if(!isMatch) res.status(200).json({message:'Wrong password'});
            else {
                const token = await usr.generateAuthToken();
                res.status(200).json({message:'Logged in Successfully', token: token});
            }
        })
    })
})

app.get('/welcome', auth, (req,res) => {
    res.status(200).send(req.user);
})

app.post('/api/:user/delete_reminder/:date/:msg', auth, (req, res) => {
    remainder.findOne({'creator':req.params.user,'message':req.params.msg, 'date':req.params.date}, async (err, rem_obj) => {
        if(err) res.status(200).json({message: "some error occured in getting reminders"})
        if(rem_obj != null) {
            msg_array = rem_obj.message;
            msg_Id = rem_obj._id
            _date = rem_obj.date
            if(msg_array.length == 1){
                remainder.deleteOne({'_id': msg_Id}, (err, res) => {
                    if(err) console.log(err)
                    if(res) console.log("removed remainder object")
                })
                user.findOne({'email':req.params.user}, (err, usr) => {
                    if(err) res.status(200).json({message:"some error occured in fetching user"})
                    if(usr){
                        rem_array = usr.reminders
                        rem_array.splice(rem_array.indexOf(msg_Id), 1)
                        usr.reminders = rem_array
                        usr.save()
                    }
                })
                await updateSchedularDelete(req.params.user)
            }else {
                msg_array.splice(msg_array.indexOf(req.params.msg), 1)
                rem_obj.message = msg_array
                rem_obj.save()
            }
            res.status(200).json({message:"Reminder deleted!"}) 
        } else {
            res.status(200).json({message:"Reminder does not exist"})
        }
    })
})

async function updateSchedularDelete(email){
    schedular.findOne({'date': _date, 'users':email}, (err, sch_obj) => {
        if(err) res.status(200).json({message:"Error in fetching schedular"})
        if(sch_obj){
            usr_array = sch_obj.users
            sch_Id = sch_obj._id
            if(usr_array.length == 1){
                schedular.deleteOne({'_id': sch_Id}, (err, res) => {
                    if(err) res.status(200).json({message: "Error in updating schedular"})
                    if(res) console.log("Removed Schedular Object")
                })
            } else {
                usr_array.splice(usr_array.indexOf(uemailser), 1)
                sch_obj.users = usr_array
                sch_obj.save()
            }
        }
    })
}

app.post('/api/:user/get_reminders', auth, (req, res) => {
    date_arr = []
    msg_arr = []
    msg_temp = []
    user.findOne({'email': req.params.user}, (err, usr) => {
        if(err) res.status(400).json({message: "Some error occured in getting reminders"})
        reminders_array = usr.reminders
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
                    })
                }
            }
            forLoop();
        }else {
            res.status(200).json({message: "No reminders found!"})
        }
    })
})

app.post('/api/:user/get_capsules', auth, (req,res) => {
    capsule_type = []
    capsule_status = []
    user.findOne({'email': req.params.user}, (err, usr) => {
        if(err) res.status(200).json({message: "some error occured while fetching capsules!"})
        capsule_array = usr.capsules
        const forLoop = async _ => {
            for(i=0;i<capsule_array.length;i++){
                capsuleSc.findOne({'_id': capsule_array[i]}, (err, capObj) => {
                    if(err) res.status(200).json({message: "Some error occured while fetching capsule objects"})
                    capsule_type.push(capObj.type)
                    capsule_status.push(capObj.status)
                    if(capsule_type.length == capsule_array.length -1 || capsule_array.length == 1) {
                        setTimeout(function() {
                            res.status(200).json({type: capsule_type, status: capsule_status})
                        }, 2000)
                    }
                })
            }
        }
        forLoop();
    })
})

app.post('/api/:user/add_date',auth, (req, res) => {
    var today = moment().format('DD/MM')
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
        if(req.body.date == today){
            sendMsg(req.body.message, usr.number)
        }
    })
})

app.post('/api/logout', auth, async (req,res) => {
    try{
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.status(200).json({message: "Successfully logged out"})
    }catch(error){
        res.status(500).send(error)
    }
})

app.post('/api/date', async (req, res) => {
    try{
        res.status(200).json({'fulfillmentText': 'This is a response from webhook.'});
        console.log(req.body);
    }catch(error){

    }
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

cron.schedule("0 7 * * *", function(){
     runSchedular();
});

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
                                    sendMsg(msgArr[i], userObj.number)
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

app.post('/api/sendMsg', (req,res) => {
    // Replace X with phone number
    sendMsg(req.body.msg, req.body.number);
    res.status(200).json({message: "SMS Delivery Initiated!"})
})

function sendMsg(msg, number){
    fMsg = "REMINDME REMINDER\nMessage: " + msg 
    encodedmsg = encodeURIComponent(fMsg)
    retMsg = ''
    const data = 'apikey=' + process.env.apikey + '&numbers=' + number + '&message=' + encodedmsg + '&sender=TXTLCL';
    var options = {
        host: 'api.textlocal.in',
        path: '/send?' + data      
    };

    callback = function(response){
        var str = ''
        response.on('data', function(chunk){
            str += chunk;;
        });
        response.on('end', function(){
            retMsg = JSON.parse(JSON.stringify(str))
            console.log(retMsg)
        });

1   }
    http.request(options, callback).end()
    
}

const port = process.env.PORT
// https.createServer({
//     key: fs.readFileSync('cert/server.key'),
//     cert: fs.readFileSync('cert/server.cert')
// }, app).listen(port, ()=> {
//     console.log('Server Deployed on Port: '+ port)
// })
app.listen(port, ()=> {
    console.log('Server deployed on port:' + port);
})
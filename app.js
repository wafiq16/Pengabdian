var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fire = require('./routes/fire')
var db = fire.database()

const mqtt = require('mqtt')
const fs = require('fs')
const { Command } = require('commander')

const program = new Command()
program
    .option('-p, --protocol <type>', 'connect protocol: mqtt, mqtts, ws, wss. default is mqtt', 'mqtt')
    .parse(process.argv)

const host = 'broker.hivemq.com'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

// connect options
const OPTIONS = {
        clientId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000,
    }
    // protocol list
const PROTOCOLS = ['mqtt', 'mqtts', 'ws', 'wss']

// default is mqtt, unencrypted tcp connection
let connectUrl = `mqtt://${host}:${port}`
if (program.protocol && PROTOCOLS.indexOf(program.protocol) === -1) {
    console.log('protocol must one of mqtt, mqtts, ws, wss.')
} else if (program.protocol === 'mqtts') {
    // mqtts， encrypted tcp connection
    connectUrl = `mqtts://${host}:8883`
    OPTIONS['ca'] = fs.readFileSync('./broker.emqx.io-ca.crt')
} else if (program.protocol === 'ws') {
    // ws, unencrypted WebSocket connection
    const mountPath = '/mqtt' // mount path, connect emqx via WebSocket
    connectUrl = `ws://${host}:8083${mountPath}`
} else if (program.protocol === 'wss') {
    // wss, encrypted WebSocket connection
    const mountPath = '/mqtt' // mount path, connect emqx via WebSocket
    connectUrl = `wss://${host}:8084${mountPath}`
    OPTIONS['ca'] = fs.readFileSync('./broker.emqx.io-ca.crt')
} else {}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// app.listen(8080);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


const topic = '/Pengabdian/dataKolam'
const topic2 = '/Pengabdian/dataDummy'

const client = mqtt.connect(connectUrl, OPTIONS)

client.on('connect', () => {
    console.log(`${program.protocol}: Connected`)
    client.subscribe([topic], () => {
        console.log(`${program.protocol}: Subscribe to topic '${topic}'`)
    })
    client.subscribe([topic2], () => {
        console.log(`${program.protocol}: Subscribe to topic '${topic2}'`)
    })
})

client.on('reconnect', (error) => {
    console.log(`Reconnecting(${program.protocol}):`, error)
})

client.on('error', (error) => {
    console.log(`Cannot connect(${program.protocol}):`, error)
})

client.on('message', (topic, payload) => {
    console.log('Received Message:', topic, payload.toString())
    obj = JSON.parse(payload.toString())
    var id_hardware = obj.id_hardware
    var salinitas = obj.salinitas
    var ph = obj.ph
    var suhu = obj.suhu
    var id_kolam = obj.id_kolam
    var date = new Date().toLocaleDateString("en-US", {timeZone: "Asia/Jakarta"});
    var time = new Date().toLocaleTimeString("en-US", {timeZone: "Asia/Jakarta"});
    // console.log(today);
    // var date = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();
    // var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    obj.date = date
    obj.time = time

    const start = Date.now()

    if (topic == topic2) {
        // console.log(time)
        db.ref("dummy").push(obj, function(error) {
            if (error) {
                // The write failed...
                console.log("Failed with error: " + error)
            } else {
                // The write was successful...
                console.log("success")
            }
        })
    }
    else{
        // console.log(time)
        db.ref("alat").push(obj, function(error) {
            if (error) {
                // The write failed...
                console.log("Failed with error: " + error)
            } else {
                // The write was successful...
                console.log("success")
            }
        })
    }
    const stop = Date.now()
    console.log(`Time Taken to execute = ${(stop - start)/1000} seconds`);
})

var intervalId = setInterval(() => {
    // alert("Interval reached every 5s")
    var obj;
    // console.log("jalan");
},
500);
// client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
//     if (error) {
//         console.error(error)
//     }
// })

// const client = mqtt.connect(connectUrl, OPTIONS)

module.exports = app;
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fire = require('./routes/fire')
var db = fire.firestore()

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

const client = mqtt.connect(connectUrl, OPTIONS)

client.on('connect', () => {
    console.log(`${program.protocol}: Connected`)
    client.subscribe([topic], () => {
        console.log(`${program.protocol}: Subscribe to topic '${topic}'`)
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

    db.settings({
        timestampsInSnapshots: true
    })
    db.collection('tambak').add({
        id_hardware: id_hardware,
        salinitas: salinitas,
        ph: ph,
        suhu: suhu,
        id_kolam: id_kolam,
    })
})

client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
    if (error) {
        console.error(error)
    }
})

module.exports = app;
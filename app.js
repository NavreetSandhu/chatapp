import express from "express"
import logger from 'morgan';
import bodyParser from 'body-parser';
import Debug from 'debug';
import  cors from 'cors';
import  path from 'path';
import fileUpload from "express-fileupload";
//import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-config.js';
//import sequelize from 'sequelize';
import models, { sequelize } from './models';
import api from './api/';
import { failAction } from "./utilities/response";
// This will be our application entry. We'll setup our server here.
import http from 'http';
import SocketService from "./utilities/socket/socketService";

require('dotenv').config();
//import models from './models';

const app = express();
app.use(cors());
app.use(fileUpload());
app.use(logger('dev'));

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

app.use('/public', express.static('public'));
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Credentials', true);

  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
};
app.use(allowCrossDomain);

app.set('view engine', 'ejs');

/**************Swagger Set-up*****************/
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", api);
// After your routes add a standard express error handler. This will be passed the Joi
// error, plus an extra "type" field so we can tell what type of validation failed
app.use((err, req, res, next) => {
  //console.log("err: ", err);

  if (err && err.error && err.error.isJoi) {
    // we had a joi error, let's return a custom 400 json response
    res
      .status(400)
      .json(failAction(err.error.message.toString().replace(/[\""]+/g, "")));
  } else {
    // pass on to another error handler
    next(err);
  }
});

//import authentication from './server/config/routes';
//import oauth2 from './server/config/Oauth2';

//require('./server/config/passport')(passport);

//app.post('/oauth/token', allowCrossDomain, oauth2.token);

app.get('*', (req, res) => res.status(200).send({
  message: 'Welcome to chat app.',
}));

// Production error handler
if (app.get('env') === 'production') {
  app.use(function (err, req, res, next) {
      console.error(err.stack);
      res.sendStatus(err.status || 500);
  });
}
// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    err.msg = "Unable to proccess request" ;
    res.status(404).send(err);
});



const port = parseInt(process.env.PORT, 10) || 8000;
console.log('port >>', port)
app.set('port', port);
const server = http.createServer(app);
// Don't run with sync true if data exist in tables
const eraseDatabaseOnSync = false; // If true sync models to db and if false will not sync
// models.sequelize.sync().then(function() {
//     /**
//      * Listen on provided port, on all network interfaces.
//      */
//     server.listen(port, function() {
//         debug('Express server listening on port ' + server.address().port);
//     });
//     server.on('error', onError);
//     server.on('listening', onListening);
// });
//sequelize.sync({ alter: true, logging: console.log } ).then(async () => {
  
  server.listen(port, () => {
    console.log(`The server is running at localhost:${port}`);
  });

//});
/* Configure socket implementation */
SocketService(server);
export default app;

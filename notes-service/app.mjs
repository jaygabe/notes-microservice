// import createError from 'http-errors';
import { default as express } from 'express';
import * as path from 'path';
import { default as DBG } from 'debug';
const debug = DBG('notes:debug');
const dbgerror = DBG('notes:error');
// import * as favicon from 'serve-favicon';
import { default as cookieParser } from 'cookie-parser';
import { default as logger } from 'morgan';
import { default as rfs } from 'rotating-file-stream';
import * as http from 'http';
import { approotdir } from './approotdir.mjs';
const __dirname = approotdir;
import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler,
} from './appsupport.mjs';

//////////////////////////////////////////////////////////

import hbs from 'hbs';

/**
 * Import DYNAMIC Stores Functionality
 */
import { useModel as useNotesModel } from './models/notes-store.mjs';
useNotesModel(
  process.env.NOTES_MODEL ? process.env.NOTES_MODEL.trim() : 'memory'
)
  .then((store) => {})
  .catch((error) => {
    onError({ code: 'ENOTESSTORE', error });
  });
////////////////////////////////////////////////////////

/**
 * Import routers
 */
import { router as indexRouter } from './routes/index.mjs';
import { router as notesRouter } from './routes/notes.mjs';
import { router as usersRouter, initPassport } from './routes/users.mjs';
///////////////////////////////////////////////////////////

export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// Find a way to add the below line to logger methodin a way that works
// process.env.REQUEST_LOG_FORMAT || 'dev'
app.use(
  logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
    stream: process.env.REQUEST_LOG_FILE
      ? rfs.createStream(process.env.REQUEST_LOG_FILE, {
          size: '10M', // rotate every 10 megabytes written
          interval: '1d', // rotate daily
          compress: 'gzip', // compress rotated files
        })
      : process.stdout,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/assets/vendor/bootstrap',
  express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist'))
);
app.use(
  '/assets/vendor/jquery',
  express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'))
);
app.use(
  '/assets/vendor/popper.js',
  express.static(path.join(__dirname, 'node_modules', 'popper.js', 'dist'))
);
app.use(
  '/assets/vendor/feather-icons',
  express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist'))
);

/**
 * Import modules for session handling
 */
import session from 'express-session';
import sessionFileStore from 'session-file-store';
const FileStore = sessionFileStore(session);
export const sessionCookieName = 'notescookie.sid';

// Session middleware
app.use(
  session({
    store: new FileStore({ path: 'sessions' }),
    secret: 'keyboard mouse',
    resave: true,
    saveUninitialized: true,
    name: sessionCookieName,
  })
);

initPassport(app);

app.use('/', indexRouter);
app.use('/notes', notesRouter);
app.use('/users', usersRouter);

// error handler
// catch 404 and forward to error handler
app.use(handle404);
app.use(basicErrorHandler);

export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

export const server = http.createServer(app);
console.log('Runs');
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.on('request', (req, res) => {
  debug(`${new Date().toISOString()} request ${req.method} ${req.url}`);
});

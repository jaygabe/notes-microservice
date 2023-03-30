import { port } from './app.mjs';
import { default as DBG } from 'debug';
const debug = DBG('notes:debug');
const dbgerror = DBG('notes:error');

// Handles safely converting a port number string
// into numerical value
export function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

// Handles errors from the HTTP server object
export function onError(error) {
  dbgerror(error);

  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
    case 'ENOTESSTORE':
      console.error(
        `Notes data store initialization failure because `,
        error.error
      );
      process.exit(1);
    default:
      throw error;
  }
}

// Prints a user-friendly message saying where the server
// is listening for HTTP connections
import { server } from './app.mjs';
export function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug(`Listening on ${bind}`);
}

// Other error handling
export function handle404(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
}

export function basicErrorHandler(err, req, res, next) {
  // Defer to build-in error handler if headerSent
  // See: http://expressjs.com/en/guide/error-handling.html
  if (res.headerSent) {
    return next(err);
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}

process.on('uncaughtException', function (err) {
  console.error(`I've crashed!!! - ${err.stack || err}`);
});

import * as util from 'util';
process.on('unhandledRejection', (reason, p) => {
  console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`);
});

import { NotesStore } from './models/notes-store.mjs';

async function catchProcessDeath() {
  debug('urk...');
  await NotesStore.close();
  server.close();
  process.exit(0);
}

process.on('SIGTERM', catchProcessDeath);
process.on('SIGINT', catchProcessDeath);
process.on('SIGHUP', catchProcessDeath);

process.on('exit', () => {
  debug('exiting...');
});

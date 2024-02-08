import createError from 'http-errors';
import express from 'express';
import logger from 'morgan';
import debug from 'debug';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'dotenv/config';

import indexRouter from './routes/index.js';
import syncData from './routes/sync.js';

const app = express();

const info = debug('info');
app.use(logger('combined', { stream: { write: (msg) => info(msg) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// swagger
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'oss-integration-service API',
      version: '0.1.0',
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true }),
);
// mount routers
app.use('/', indexRouter);
app.use('/sync', syncData);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;

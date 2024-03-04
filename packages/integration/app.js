import express from 'express';
import logger from 'morgan';
import debug from 'debug';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'dotenv/config';
import 'express-async-errors';

import indexRouter from './routes/index.js';
import syncRouter from './routes/sync.js';
import evaluateRouter from './routes/evaluate.js';

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
app.use('/sync', syncRouter);
app.use('/eval', evaluateRouter);

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).json({
    error: 404,
    message: 'Not found.',
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let { statusCode } = res;
  // Even in error cases, status code is 200 by default
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }
  res.status(statusCode).json({
    error: err.status,
    message: err.message,
    stack: err.stack,
  });
});

export default app;

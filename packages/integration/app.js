import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'dotenv/config';
import 'express-async-errors';

import indexRouter from './routes/index.js';
import syncRouter from './routes/sync.js';
import evaluateRouter from './routes/evaluate.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import morgan from 'morgan';

const app = express();

const stream = {
  write: message => logger.info(message),
};
const customCombined =
  ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer"' +
  ' ":user-agent" @:response-time ms';

app.use(morgan(customCombined, { stream }));

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
// mount routers
app.use('/', indexRouter);
app.use('/sync', syncRouter);
app.use('/eval', evaluateRouter);

// catch 404 and forward to error handler
app.use((req, res) => {
  const message = {
    error: 404,
    message: 'Not found.',
  };
  logger.error(message);
  res.status(404).json(message);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  let { statusCode } = res;
  // Even in error cases, status code is 200 by default
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }
  const message = {
    status: statusCode,
    message: err.message,
    stack: err.stack,
  };
  logger.error(message);
  res.status(statusCode).json(message);
});

export default app;

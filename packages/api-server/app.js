import express, { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import 'dotenv/config';
import 'express-async-errors';

import indexRouter from './routes/index.js';
import ecologyRouter from './routes/softwareEcology.js';
import detailRouter from './routes/softwareDetail.js';
import trendPage from './routes/trendPage.js';
import homePage from './routes/homePage.js';

const app = express();

// cors
app.use(cors());
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/softwareDetail', detailRouter);
app.use('/trend', trendPage);
app.use('/home', homePage);
app.use('/', ecologyRouter);

// swagger
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'oss-evaluation-service api-server',
      version: '0.1.0',
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).json({
    error: 404,
    message: 'Not found.',
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

import express, { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';

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
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true }),
);

export default app;

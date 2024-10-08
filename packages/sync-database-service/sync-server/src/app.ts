import type { Request, Response } from 'express';
import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import 'express-async-errors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { RegisterRoutes } from './build/routes.js';
import swaggerConfig from './build/swagger.json' assert { type: 'json' };
import logger from './logger/pino-logger.js';

const port = process.env.PORT || '13015';
const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
RegisterRoutes(app);
// swagger
app.use('/api-docs', swaggerUi.serve, async (req: Request, res: Response) => {
  return res.send(swaggerUi.generateHTML(swaggerConfig));
});

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).json({
    error: 404,
    message: 'Not found.',
  });
});

// 1分钟最多请求60次
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});

// 应用速率限制器到所有请求
app.use(limiter);

app.use((err: Error, req: Request, res: Response) => {
  let { statusCode } = res;
  // Even in error cases, status code is 200 by default
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }
  res.status(statusCode).json({
    message: err.message,
    stack: err.stack,
  });
});

app.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});

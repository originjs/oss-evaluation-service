import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const promiseData = new Promise((resolve) => {
    setTimeout(() => {
      const data = { message: 'Hello Data' };
      resolve(data);
    }, 1000);
  });
  const data = await promiseData;
  res.json(data.message);
});

export default router;

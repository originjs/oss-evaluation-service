import express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.status(200).json({ ok: '200' });
});

export default router;

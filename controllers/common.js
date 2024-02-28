export function getDelayedMessage(req, res) {
  const { delay } = req.body;
  setTimeout(() => {
    res.status(200).send(`Timeout for ${delay}ms ends!`);
  }, delay);
}

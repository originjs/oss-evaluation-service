const express = require('express');
const router = express.Router();
const { getMetricActivity } = require('../../controllers/integration/compass');


router.route('/integration/compass').get(getMetricActivity);

module.exports = router;

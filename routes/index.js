const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const Scheduler = require('../services/Scheduler');

const scheduler = new Scheduler();

router.post('/echoAtTime', [
    check('time', 'time does not follow format ISO8601').isISO8601(),
    check('message', 'message is blank').isString()
], function (req, resp) {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
      return resp.status(400).json({errors: errors.array()});
  }
  scheduler.schedule(req.body.time, req.body.message)
      .then(() => {
          resp.sendStatus(200);
      }).catch((error) => {
          console.error("Error: ", error);
        resp.sendStatus(500);
      });
})

module.exports = router;

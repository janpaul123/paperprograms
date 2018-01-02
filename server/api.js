const express = require('express');

const router = express.Router();

router.use(express.json());

router.get('/spaces/:spaceName', function(req, res) {
  res.json({
    editorUrl: `${req.headers.host}/editor/${req.params.spaceName}`,
  });
});

module.exports = router;

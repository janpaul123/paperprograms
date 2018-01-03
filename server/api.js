const express = require('express');

const router = express.Router();
router.use(express.json());

const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);

function getSpaceData(req, callback) {
  const { spaceName } = req.params;
  knex('programs')
    .select('number', 'originalCode', 'currentCode', 'printed')
    .where({ spaceName })
    .then(programData => {
      callback({
        programs: programData,
        spaceName,
      });
    });
}

router.get('/spaces/:spaceName', function(req, res) {
  getSpaceData(req, spaceData => {
    res.json(spaceData);
  });
});

const maxNumber = 625;
router.post('/spaces/:spaceName/programs', function(req, res) {
  const { spaceName } = req.params;
  const { code } = req.body;
  if (!code) return res.status(400).send('Missing "code"');

  knex
    .select('number')
    .from('programs')
    .where({ spaceName })
    .then(selectResult => {
      const existingNumbers = selectResult.map(result => result.number);
      const potentialNumbers = [];
      for (let i = 0; i < maxNumber; i++) {
        if (!existingNumbers.includes(i)) potentialNumbers.push(i);
      }
      if (potentialNumbers.length === 0) return res.status(400).send('No more available numbers');
      const number = potentialNumbers[Math.floor(Math.random() * potentialNumbers.length)];

      knex('programs')
        .insert({ spaceName, number, originalCode: code, currentCode: code })
        .then(() => {
          getSpaceData(req, spaceData => {
            res.json({ number, spaceData });
          });
        });
    });
});

router.put('/spaces/:spaceName/programs/:number', function(req, res) {
  const { spaceName, number } = req.params;
  const { code } = req.body;
  if (!code) return res.status(400).send('Missing "code"');

  knex('programs')
    .update({ currentCode: code })
    .where({ spaceName, number })
    .then(() => {
      res.json({});
    });
});

router.post('/spaces/:spaceName/programs/:number/markPrinted', function(req, res) {
  const { spaceName, number } = req.params;

  knex('programs')
    .update({ printed: true })
    .where({ spaceName, number })
    .then(() => {
      getSpaceData(req, spaceData => {
        res.json(spaceData);
      });
    });
});

module.exports = router;

const crypto = require('crypto');
const express = require('express');

const router = express.Router();
router.use(express.json());
router.use(require('nocache')());

const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);

router.get('/program.:spaceName.:number.js', (req, res) => {
  const { spaceName, number } = req.params;
  knex
    .select('currentCode')
    .from('programs')
    .where({ spaceName, number })
    .then(selectResult => {
      res.set('Content-Type', 'text/javascript;charset=UTF-8');
      res.send(selectResult[0].currentCode);
    });
});

function getSpaceData(req, callback) {
  const { spaceName } = req.params;
  knex('programs')
    .select('number', 'originalCode', 'currentCode', 'printed')
    .where({ spaceName })
    .then(programData => {
      callback({
        programs: programData.map(program => ({
          ...program,
          currentCodeUrl: `program.${spaceName}.${program.number}.js`,
          currentCodeHash: crypto
            .createHmac('sha256', '')
            .update(program.currentCode)
            .digest('hex'),
          debugUrl: `/api/spaces/${spaceName}/programs/${program.number}/debugInfo`,
        })),
        spaceName,
      });
    });
}

router.get('/api/spaces/:spaceName', (req, res) => {
  getSpaceData(req, spaceData => {
    res.json(spaceData);
  });
});

const maxNumber = 625;
router.post('/api/spaces/:spaceName/programs', (req, res) => {
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

router.put('/api/spaces/:spaceName/programs/:number', (req, res) => {
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

router.post('/api/spaces/:spaceName/programs/:number/markPrinted', (req, res) => {
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

router.put('/api/spaces/:spaceName/programs/:number/debugInfo', (req, res) => {
  const { spaceName, number } = req.params;

  knex('programs')
    .update({ debugInfo: JSON.stringify(req.body) })
    .where({ spaceName, number })
    .then(() => {
      res.json({});
    });
});

router.get('/api/spaces/:spaceName/programs/:number/debugInfo', (req, res) => {
  const { spaceName, number } = req.params;

  knex
    .select('debugInfo')
    .from('programs')
    .where({ spaceName, number })
    .then(selectResult => {
      if (selectResult.length === 0) return res.status(404);
      res.json(JSON.parse(selectResult[0].debugInfo || '{}'));
    });
});

module.exports = router;

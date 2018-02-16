import shuffleSeed from 'shuffle-seed';
import uniq from 'lodash/uniq';

function permutations(n, colors, arr) {
  if (!n) return [arr];
  if (!arr) arr = [];
  let ret = [];
  for (let i = 0; i < colors; i++) ret = ret.concat(permutations(n - 1, colors, arr.concat([i])));
  return ret;
}

export const code8400 = shuffleSeed.shuffle(
  permutations(7, 4)
    .filter(colors => uniq(colors).length >= 4)
    .map(colors => colors.join('')),
  'someseed'
);

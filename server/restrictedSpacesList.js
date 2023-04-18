/**
 * This file contains a list of the play spaces whose files are considered "restricted".  This means that users must
 * have certain environment variables set to edit these files, otherwise they will be seen as read-only on the client
 * side.
 *
 * See https://github.com/phetsims/paper-land/issues/49 for the history of this feature.
 */

const restrictedSpacesList = [
  'jb-tests',
  'jg-tests',
  'templates',
  'altitude-demo',
  'density-demo',
  'lunar-lander',
  'idrc-design-crit-2023',
  'simple-demos',
  'quadrilateral-sim-demo'
];

module.exports = restrictedSpacesList;
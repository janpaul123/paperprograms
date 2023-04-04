/**
 * This file contains a list of the play spaces whose files are considered "restricted".  This means that users must
 * have certain environment variables set to edit these files, otherwise they will be seen as read-only on the client
 * side.
 *
 * See https://github.com/phetsims/paper-land/issues/49 for the history of this feature.
 */

const restrictedSpacesList = [
  'jb-tests',
  'templates'
];

module.exports = restrictedSpacesList;
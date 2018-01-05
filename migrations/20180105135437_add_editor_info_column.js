exports.up = function(knex) {
  return knex.schema.table('programs', function(table) {
    table
      .text('editorInfo')
      .notNullable()
      .defaultTo('');
  });
};

exports.down = function(knex) {
  return knex.schema.table('programs', function(table) {
    table.dropColumn('editorInfo');
  });
};

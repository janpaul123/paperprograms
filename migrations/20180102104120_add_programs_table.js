exports.up = function(knex) {
  return knex.schema.createTable('programs', function(table) {
    table.string('spaceName');
    table.integer('number');
    table.text('originalCode');
    table.text('currentCode');
    table.boolean('printed');
    table.text('debugInfo');
    table.primary(['spaceName', 'number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('programs');
};

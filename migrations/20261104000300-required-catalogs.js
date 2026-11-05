export default {
  async up(q) {
    for (const [table, pk, names] of [
      ['roles', 'id_rol', ['Administrador', 'Medico', 'Paciente']],
      ['estados_cita', 'id_estado', ['Pendiente', 'En Curso', 'Completada', 'Cancelada', 'Confirmada']],
    ]) {
      for (const [index, nombre] of names.entries()) {
        const id = index + 1;
        const [rows] = await q.sequelize.query('SELECT * FROM `' + table + '` WHERE `' + pk + '` = :id', { replacements: { id } });
        if (!rows.length) await q.bulkInsert(table, [{ [pk]: id, nombre }]);
      }
    }
  },
  async down() { throw new Error('Los catálogos pueden estar referenciados por datos de la aplicación.'); },
};

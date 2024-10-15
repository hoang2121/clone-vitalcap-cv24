'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.addColumn('Schedules', 'timeCreated', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.addColumn('Schedules', 'timeAppointed', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.renameColumn('Schedules', 'tags', 'sendTo');
    await queryInterface.renameColumn('Schedules', 'appointment_name', 'appointmentName');
    await queryInterface.renameColumn('Schedules', 'description', 'content');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    // Remove columns added in the up function
    await queryInterface.removeColumn('Schedules', 'timeCreated');
    await queryInterface.removeColumn('Schedules', 'timeAppointed');

    // Rename columns back to their original names
    await queryInterface.renameColumn('Schedules', 'sendTo', 'tags');
    await queryInterface.renameColumn('Schedules', 'appointmentName', 'appointment_name');
    await queryInterface.renameColumn('Schedules', 'content', 'description');
  }
};

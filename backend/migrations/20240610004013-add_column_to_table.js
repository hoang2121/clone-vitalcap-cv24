'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.addColumn('Files', 'version', {
      type: Sequelize.BIGINT,
      allowNull: true, // Adjust as needed
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.removeColumn('Files', 'version');
  }
};

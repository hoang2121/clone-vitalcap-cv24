'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.removeColumn('Files', 'isPublic');
    await queryInterface.addColumn('Files', 'isPublic', {
      type: Sequelize.BOOLEAN,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.removeColumn('Files', 'isPublic');
    await queryInterface.addColumn('Files', 'isPublic', {
      type: Sequelize.BOOLEAN,
      allowNull: false, // Assuming the previous state required not null
    });
  }
};

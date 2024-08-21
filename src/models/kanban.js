module.exports = (sequelize, DataTypes) => {
  const Kanban = sequelize.define(
    "Kanban",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "room",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      section: {
        type: DataTypes.STRING(50),
      },
    },
    {
      tableName: "kanban",
      timestamps: true,
      paranoid: true,
    }
  );

  Kanban.associate = (models) => {
    Kanban.belongsTo(models.Room, { foreignKey: "room_id" });
    Kanban.belongsTo(models.User, { foreignKey: "user_id" });
    Kanban.hasMany(models.Content, { foreignKey: "kanban_id" });
  };

  return Kanban;
};

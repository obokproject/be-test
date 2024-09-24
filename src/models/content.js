module.exports = (sequelize, DataTypes) => {
  const Content = sequelize.define(
    "Content",
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
      kanban_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "kanban",
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
      content: {
        type: DataTypes.STRING(50),
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "content",
      timestamps: true,
      paranoid: true,
    }
  );

  Content.associate = (models) => {
    Content.belongsTo(models.Room, { foreignKey: "room_id" });
    Content.belongsTo(models.Kanban, { foreignKey: "kanban_id" });
    Content.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Content;
};

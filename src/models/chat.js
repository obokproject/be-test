module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define(
    "Chat",
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
      content: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "chat",
      timestamps: true,
      paranoid: true,
    }
  );

  Chat.associate = (models) => {
    Chat.belongsTo(models.Room, { foreignKey: "room_id" });
    Chat.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Chat;
};

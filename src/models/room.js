module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.CHAR(36),
        unique: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("chat", "kanban"),
        allowNull: false,
      },
      max_member: {
        type: DataTypes.INTEGER,
        defaultValue: 4,
      },
      duration: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      status: {
        type: DataTypes.ENUM("active", "completed", "closed", "open"),
      },
    },
    {
      tableName: "room",
      timestamps: true,
      paranoid: true,
    }
  );

  Room.associate = (models) => {
    Room.hasMany(models.Keyword, { foreignKey: "room_id" });
    Room.hasMany(models.Member, { foreignKey: "room_id" });
    Room.hasMany(models.Chat, { foreignKey: "room_id" });
    Room.hasMany(models.Kanban, { foreignKey: "room_id" });
    Room.hasMany(models.Content, { foreignKey: "room_id" });
    Room.hasMany(models.Chatkeyword, { foreignKey: "room_id" });
    Room.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Room;
};

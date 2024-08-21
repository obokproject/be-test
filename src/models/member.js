module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define(
    "Member",
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
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      role: {
        type: DataTypes.ENUM("host", "guest"),
      },
    },
    {
      tableName: "member",
      timestamps: true,
      paranoid: true,
      uniqueKeys: {
        room_user_unique: {
          fields: ["room_id", "user_id"],
        },
      },
    }
  );

  Member.associate = (models) => {
    Member.belongsTo(models.Room, { foreignKey: "room_id" });
    Member.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Member;
};

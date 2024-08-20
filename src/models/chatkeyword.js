module.exports = (sequelize, DataTypes) => {
  const Chatkeyword = sequelize.define(
    "Chatkeyword",
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
      keyword: {
        type: DataTypes.STRING(20),
        unique: true,
      },
    },
    {
      tableName: "chatkeyword",
      timestamps: false,
    }
  );

  Chatkeyword.associate = (models) => {
    Chatkeyword.belongsTo(models.Room, { foreignKey: "room_id" });
  };

  return Chatkeyword;
};

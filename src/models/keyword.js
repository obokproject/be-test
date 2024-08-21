module.exports = (sequelize, DataTypes) => {
  const Keyword = sequelize.define(
    "Keyword",
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
        type: DataTypes.STRING(10),
      },
    },
    {
      tableName: "keyword",
      timestamps: true,
      paranoid: true,
    }
  );

  Keyword.associate = (models) => {
    Keyword.belongsTo(models.Room, { foreignKey: "room_id" });
  };

  return Keyword;
};

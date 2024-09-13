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
      chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // chat_id는 필수로 추가
        references: {
          model: "chat", // chat 테이블과 연결
          key: "id",
        },
        onDelete: "CASCADE",
      },
      keyword: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "chatkeyword",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["room_id", "keyword"], // 복합 고유 제약 조건
        },
      ],
    }
  );

  Chatkeyword.associate = (models) => {
    Chatkeyword.belongsTo(models.Room, { foreignKey: "room_id" });
    Chatkeyword.belongsTo(models.Chat, { foreignKey: "chat_id" }); // chat과 관계 설정
  };

  return Chatkeyword;
};

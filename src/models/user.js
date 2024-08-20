module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      social_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      social_type: {
        type: DataTypes.ENUM("kakao", "google"),
      },
      job: {
        type: DataTypes.STRING(255),
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      nickname: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      profile_image: {
        type: DataTypes.STRING(255),
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
      last_login_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "user",
      timestamps: false,
    }
  );

  // User.associate = (models) => {
  //   User.hasMany(models.Room, { foreignKey: "user_id" });
  //   User.hasMany(models.Member, { foreignKey: "user_id" });
  //   User.hasMany(models.Chat, { foreignKey: "user_id" });
  //   User.hasMany(models.Kanban, { foreignKey: "user_id" });
  //   User.hasMany(models.Content, { foreignKey: "user_id" });
  // };

  return User;
};

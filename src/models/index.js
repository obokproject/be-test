const Sequelize = require("sequelize");
const config = require("../config/config.json")[
  process.env.NODE_ENV || "development"
];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config, // 기존 config 객체를 펼쳐서 넣습니다.
    logging: false, // logging 옵션을 false로 설정하여 쿼리 로그를 비활성화합니다.
  }
);

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 모델 가져오기
db.User = require("./user")(sequelize, Sequelize.DataTypes);
db.Room = require("./room")(sequelize, Sequelize.DataTypes);
db.Keyword = require("./keyword")(sequelize, Sequelize.DataTypes);
db.Member = require("./member")(sequelize, Sequelize.DataTypes);
db.Chat = require("./chat")(sequelize, Sequelize.DataTypes);
db.Kanban = require("./kanban")(sequelize, Sequelize.DataTypes);
db.Content = require("./content")(sequelize, Sequelize.DataTypes);
db.Chatkeyword = require("./chatkeyword")(sequelize, Sequelize.DataTypes);

// 관계 설정
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;

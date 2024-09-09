const { User, Sequelize } = require("../models");
const { Op } = require("sequelize");

module.exports = {
  // 모든 사용자 조회
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "social_id",
          "social_type",
          "job",
          "email",
          "nickname",
          "role",
          "last_login_at",
          "createdAt",
        ],
      });
      res.json(users);
    } catch (error) {
      console.error("사용자 조회 중 오류 발생:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  },
  // 사용자 삭제
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      await user.destroy(); // soft delete (paranoid: true 때문에)
      res.json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
      console.error("사용자 삭제 중 오류 발생:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  },

  getMonthlySignups: async (req, res) => {
    const year = parseInt(req.params.year);

    try {
      const monthlySignups = await User.findAll({
        attributes: [
          [Sequelize.fn("MONTH", Sequelize.col("createdAt")), "month"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        where: Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("createdAt")),
          year
        ),
        group: [Sequelize.fn("MONTH", Sequelize.col("createdAt"))],
        order: [[Sequelize.fn("MONTH", Sequelize.col("createdAt")), "ASC"]],
      });

      // 모든 월에 대해 데이터 생성 (가입자가 없는 월도 포함)
      const formattedSignups = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 0,
      }));
      monthlySignups.forEach((signup) => {
        formattedSignups[signup.dataValues.month - 1].count = parseInt(
          signup.dataValues.count
        );
      });

      res.json(formattedSignups);
    } catch (error) {
      console.error("월별 가입자 통계 조회 중 오류 발생:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  },
};

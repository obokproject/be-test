module.exports = (pool) => ({
  googleCallback: async (req, res) => {
    try {
      // 여기에 세션 저장 로직 추가 (필요시)
      console.log(res);
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("http://localhost:3000");
      });
    } catch (error) {
      console.error("Google callback error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: err });
      }
      res.clearCookie("connect.sid"); // 세션 쿠키 제거
      res.status(200).json({ message: "Logged out successfully" });
    });
  },

  getUser: (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  },

  getUserById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM user WHERE id = ?", [id]);
    return rows[0] || null;
  },

  findOrCreateUser: async (profile) => {
    const [rows] = await pool.query("SELECT * FROM user WHERE social_id = ?", [
      profile.id,
    ]);

    if (rows.length) {
      return rows[0];
    }

    const [result] = await pool.query(
      "INSERT INTO user (social_id, email, nickname, profile_image) VALUES (?, ?, ?, ?)",
      [
        profile.id,
        profile.emails[0].value,
        profile.displayName,
        profile.photos[0].value,
      ]
    );

    return {
      id: result.insertId,
      social_id: profile.id,
      email: profile.emails[0].value,
      nickname: profile.displayName,
      profile_image: profile.photos[0].value,
    };
  },
});

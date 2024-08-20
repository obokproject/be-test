module.exports = (pool) => ({
  googlCallback: async (req, res) => {
    res.redirect("http://localhost:3000");
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("http://localhost:3000");
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
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  },

  findOrCreateUser: async (profile) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE google_id = ?", [
      profile.id,
    ]);

    if (rows.length) {
      return rows[0];
    }

    const [result] = await pool.query(
      "INSERT INTO users (google_id, email, name, profile_url) VALUES (?, ?, ?, ?)",
      [
        profile.id,
        profile.emails[0].value,
        profile.displayName,
        profile.photos[0].value,
      ]
    );

    return {
      id: result.insertId,
      google_id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      profileImage: profile.photos[0].value,
    };
  },
});

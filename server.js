const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ================= DB CONNECTION =================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "le@rn.sql",
  database: "expense_tracker"
});

db.connect((err) => {
  if (err) {
    console.log("DB Error", err);
  } else {
    console.log("MySQL Connected");
  }
});


// ================= VIEW USER EXPENSES =================
app.get("/expenses/:userId", (req, res) => {
  console.log("USER ID RECEIVED:", req.params.userId);

  const sql =
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC";

  db.query(
    sql,
    [req.params.userId],
    (err, result) => {

      if (err) {
        return res.json({ error: err });
      }

      res.json(result);

    }
  );

});


//=====post

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, result) => {
      if (err) return res.json({ message: "Error" });

      if (result.length === 0) {
        return res.json({ message: "Invalid credentials" });
      }

      return res.json({
        id: result[0].id,
        username: result[0].username,
        message: "Login success"
      });
    }
  );
});

// ================= DELETE EXPENSE =================
app.delete("/expenses/:id", (req, res) => {

  db.query(
    "DELETE FROM transactions WHERE id = ?",
    [req.params.id],
    (err) => {

      if (err) {
        return res.json({ error: err });
      }

      res.json({
        message: "Deleted Successfully"
      });

    }
  );

});


// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

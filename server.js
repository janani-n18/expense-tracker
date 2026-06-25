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
  password: process.env.DB_PASSWORD,
  database: "expense_tracker"
});

db.connect((err) => {
  if (err) {
    console.log("DB Error", err);
  } else {
    console.log("MySQL Connected");
  }
});


// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { username } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, result) => {

      if (err) {
        return res.json({ error: err });
      }

      if (result.length > 0) {
        return res.json(result[0]);
      }

      db.query(
        "INSERT INTO users (username) VALUES (?)",
        [username],
        (err2, result2) => {

          if (err2) {
            return res.json({ error: err2 });
          }

          res.json({
            id: result2.insertId,
            username
          });

        }
      );

    }
  );
});


// ================= ADD EXPENSE =================
app.post("/expenses", (req, res) => {

  const {
    user_id,
    description,
    amount,
    type,
    transaction_date
  } = req.body;

  const sql =
    "INSERT INTO transactions (user_id, description, amount, type,transaction_date) VALUES (?, ?, ?, ?, ?)";

  db.query(
    sql,
    [Number(user_id), description, amount, type, transaction_date],
    (err, result) => {

      if (err) {
        return res.json({ error: err });
      }

      res.json({
        message: "Expense saved",
        id: result.insertId
      });

    }
  );

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

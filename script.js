window.addEventListener("load", () => {

  const today =
    new Date().toISOString().split("T")[0];

  const dateField =
    document.getElementById("date");

  if (dateField) {
    dateField.value = today;
  }

  let saved = localStorage.getItem("user");

  if (saved) {
    let tempUser = JSON.parse(saved);

    if (tempUser && tempUser.id) {
      user = tempUser;
      showApp();
    } else {
      localStorage.removeItem("user");
    }
  }

});

let user = null;
let allTransactions = [];
const API = "http://localhost:5000";

// LOGIN
async function login() {
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Enter username & password");
    return;
  }

  let res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  let data = await res.json();

  console.log("LOGIN RESPONSE:", data);

  // 🔥 STRICT CHECK
  if (!data || !data.id) {
    alert("Wrong username or password");
    return;
  }

  user = data;
  localStorage.setItem("user", JSON.stringify(user));
  showApp();
}
// SHOW APP PAGE
function showApp() {
  console.log("USER DATA =", user);
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("appPage").style.display = "block";

  document.getElementById("status").innerText =
    "Welcome " + user.username;
}


// LOGOUT
function logout() {
  localStorage.removeItem("user");
  user = null;

  document.getElementById("loginPage").style.display = "block";
  document.getElementById("appPage").style.display = "none";

  document.getElementById("list").innerHTML = "";
}


// ADD EXPENSE
async function addExpense() {

  if (!user) {
    alert("Login first");
    return;
  }

  const description = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const transaction_date = document.getElementById("date").value;

  if (!description || !amount) {
    alert("Fill all fields");
    return;
  }

  try {

    await fetch(API + "/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: Number(user.id),
        description,
        amount,
        type,
        transaction_date
      })
    });

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";

    alert("Saved Successfully");

  } catch (err) {
    console.log(err);
    alert("Save failed");
  }

document.getElementById("desc").value = "";
document.getElementById("amount").value = "";
document.getElementById("type").value = "income";
}

// VIEW EXPENSES
async function loadExpenses() {

  if (!user) {
    alert("Login first");
    return;
  }

  try {

    let res = await fetch(API + "/expenses/" + user.id);
    let data = await res.json();

    allTransactions = data;

    let list = document.getElementById("list");
    list.innerHTML = "";


    document.getElementById("summary").innerHTML = "";

    if (!data.length) {
      list.innerHTML = "<p>No Transactions Found</p>";
      return;
    }

    const grouped = {};

    data.forEach(item => {

      const d = new Date(item.transaction_date || item.created_at);

      const monthKey = d.toLocaleString("en-US", {
        month: "long",
        year: "numeric"
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          income: 0,
          expense: 0,
          items: []
        };
      }

      if (item.type === "income") {
        grouped[monthKey].income += Number(item.amount);
      } else {
        grouped[monthKey].expense += Number(item.amount);
      }

      grouped[monthKey].items.push(item);

    });

    const sortedMonths = Object.keys(grouped).sort((a, b) => {
  return new Date(b) - new Date(a);
});

for (const month of sortedMonths) {

      const income = grouped[month].income;
      const expense = grouped[month].expense;
      const balance = income - expense;

      list.innerHTML += `
  <div class="summary-card">

    <div class="month-header">
      <h3>${month}</h3>

      <button
        class="download-btn"
        onclick="downloadMonthReport('${month}')">
        ⬇
      </button>

    </div>

    <p>Income : ₹${income}</p>
    <p>Expense : ₹${expense}</p>
    <p><b>Balance : ₹${balance}</b></p>

  </div>
`;

      grouped[month].items.forEach(item => {

  const d = new Date(item.transaction_date || item.created_at);
  const date = d.toLocaleDateString("en-GB");

  const sign = item.type === "income" ? "+" : "-";

  const amountClass =
    item.type === "income" ? "income" : "expense";   // 🔥 ADD THIS

  list.innerHTML += `
    <div class="row">

      <div class="date">${date}</div>

      <div class="desc">${item.description}</div>

      <div class="${amountClass}">
        ${sign} ₹${item.amount}
      </div>

      <button class="delete-btn"
        onclick="deleteExpense(${item.id})">✕</button>

    </div>
    <hr>
  `;
});

    }

  } catch (err) {
    console.log(err);
    alert("Failed to load data");
  }
}

function searchTransactions() {

  const keyword =
    document.getElementById("search")
      .value
      .toLowerCase();

  const list =
    document.getElementById("list");

  list.innerHTML = "";

  const filtered = allTransactions.filter(item => {

    const dateObj =
      new Date(item.transaction_date);

    const date =
      dateObj.toLocaleDateString("en-GB");

    const monthYear =
      dateObj.toLocaleString("en-US", {
        month: "long",
        year: "numeric"
      }).toLowerCase();

    return (

      item.description
        .toLowerCase()
        .includes(keyword)

      ||

      item.amount
        .toString()
        .includes(keyword)

      ||

      item.type
        .toLowerCase()
        .includes(keyword)

      ||

      date
        .toLowerCase()
        .includes(keyword)

      ||

      monthYear
        .includes(keyword)

    );

  });

  filtered.forEach(item => {

    const amountClass =
      item.type === "income"
        ? "income"
        : "expense";

    const sign =
      item.type === "income"
        ? "+"
        : "-";

    const date =
      new Date(item.transaction_date)
      .toLocaleDateString("en-GB");

    list.innerHTML += `
      <div class="row">

        <div class="date">${date}</div>

        <div class="desc">${item.description}</div>

        <div class="${amountClass}">
          ${sign} ₹${item.amount}
        </div>

        <button
          class="delete-btn"
          onclick="deleteExpense(${item.id})">
          ✕
        </button>

      </div>
      <hr>
    `;

  });

}

function downloadMonthReport(month) {

  const monthData = allTransactions.filter(item => {

    const d = new Date(
      item.transaction_date || item.created_at
    );

    const monthKey = d.toLocaleString("en-US", {
      month: "long",
      year: "numeric"
    });

    return monthKey === month;
  });

  let content =
    `Expense Report - ${month}\n\n`;

  let income = 0;
  let expense = 0;

  monthData.forEach(item => {

    const date = new Date(
      item.transaction_date || item.created_at
    ).toLocaleDateString("en-GB");

    const sign =
      item.type === "income" ? "+" : "-";

    content +=
      `${date}   ${item.description}   ${sign} ₹${item.amount}\n` +
      `---------------------------------\n`;

    if (item.type === "income") {
      income += Number(item.amount);
    } else {
      expense += Number(item.amount);
    }

  });

  content += `\n`;
  content += `Income : ₹${income}\n`;
  content += `Expense : ₹${expense}\n`;
  content += `Balance : ₹${income - expense}\n`;

  const blob = new Blob(
    [content],
    { type: "text/plain" }
  );

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);

  a.download =
    month.replace(" ", "_") + "_report.txt";

  a.click();
}

  
async function deleteExpense(id) {

  if (!confirm("Delete this transaction?")) {
    return;
  }

  try {

    await fetch(
      API + "/expenses/" + id,
      {
        method: "DELETE"
      }
    );

    loadExpenses();

  } catch (err) {

    console.log(err);
    alert("Delete failed");

  }

}

function logout() {
  localStorage.removeItem("user");
  user = null;

  document.getElementById("loginPage").style.display = "block";
  document.getElementById("appPage").style.display = "none";

  document.getElementById("list").innerHTML = "";
  document.getElementById("summary").innerHTML = "";
  document.getElementById("status").innerText = "";

  // clear inputs also
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

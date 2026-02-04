/*************************************************
 * 🔐 SUPABASE INIT (ONLY ONCE)
 *************************************************/
const SUPABASE_URL = "https://xfavhimibtbkshzxwyss.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"; // keep anon, not service key

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 🔐 TEMP ADMIN (DEV MODE)
const ADMIN_EMAIL = "admin@gyanam.ai";
const ADMIN_PASSWORD = "admin123";

/*************************************************
 * 🌍 GLOBAL STATE
 *************************************************/
let allStocks = [];
let watchlist = [];
let priceMap = {};

/*************************************************
 * 🔐 UI HELPERS
 *************************************************/
function setAuthStatus(msg) {
  document.getElementById("authStatus").innerText = msg;
}

function showDashboard(show) {
  document.getElementById("dashboard").style.display = show ? "block" : "none";
  document.getElementById("authArea").style.display = show ? "none" : "block";
}

/*************************************************
 * 🔐 AUTH FUNCTIONS
 *************************************************/
async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setAuthStatus("Email & password required");
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    setAuthStatus(error.message);
  } else {
    setAuthStatus("Signup successful ✅ Now login");
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // 🔑 Admin login
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    setAuthStatus("Admin login successful ✅");
    showDashboard(true);
    loadStocks();
    return;
  }

  // 🔐 Supabase login
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setAuthStatus("Invalid credentials ❌");
  } else {
    setAuthStatus("Login successful ✅");
    showDashboard(true);
    loadStocks();
  }
}

async function logout() {
  await supabase.auth.signOut();
  watchlist = [];
  showDashboard(false);
  setAuthStatus("Logged out");
}

/*************************************************
 * 🔐 AUTH STATE LISTENER
 *************************************************/
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    showDashboard(true);
    loadStocks();
  } else {
    showDashboard(false);
  }
});

/*************************************************
 * 📊 STOCK DATA (DEMO)
 *************************************************/
function loadStocks() {
  // demo stock list (replace with JSON / DB later)
  allStocks = [
    { name: "Reliance", symbol: "RELIANCE" },
    { name: "TCS", symbol: "TCS" },
    { name: "HDFC Bank", symbol: "HDFCBANK" },
    { name: "Infosys", symbol: "INFY" }
  ];

  renderStocks(allStocks);
  renderTopPicks();
}

/*************************************************
 * 💰 PRICE SIMULATION
 *************************************************/
function getLivePrice(symbol) {
  if (!priceMap[symbol]) {
    priceMap[symbol] = 200 + Math.random() * 2000;
  }
  priceMap[symbol] += (Math.random() - 0.5) * 5;
  return priceMap[symbol].toFixed(2);
}

/*************************************************
 * 🖥️ RENDER UI
 *************************************************/
function renderStocks(stocks) {
  const div = document.getElementById("stocks");
  div.innerHTML = "<b>📊 All Stocks</b><br>";

  stocks.forEach(s => {
    div.innerHTML += `
      <p>
        ${s.name} (${s.symbol}) — ₹${getLivePrice(s.symbol)}
        <button onclick="toggleWatchlist('${s.symbol}')">
          ${watchlist.includes(s.symbol) ? "Remove ⭐" : "Add ⭐"}
        </button>
      </p>
    `;
  });
}

function renderTopPicks() {
  document.getElementById("topPicks").innerHTML =
    "<b>🔥 Top Picks</b><br>" +
    allStocks.map(s => s.name).join("<br>");
}

function renderWatchlist() {
  const div = document.getElementById("watchlist");
  div.innerHTML =
    "<b>⭐ Watchlist</b><br>" +
    (watchlist.length ? watchlist.join("<br>") : "Empty");
}

/*************************************************
 * ⭐ WATCHLIST (LOCAL FOR NOW)
 *************************************************/
function toggleWatchlist(symbol) {
  if (watchlist.includes(symbol)) {
    watchlist = watchlist.filter(s => s !== symbol);
  } else {
    watchlist.push(symbol);
  }
  renderStocks(allStocks);
  renderWatchlist();
}

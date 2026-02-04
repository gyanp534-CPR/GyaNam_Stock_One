/*************************************************
 * 🔐 SUPABASE INIT (MUST BE AT TOP)
 *************************************************/
const SUPABASE_URL = "https://xfavhimibtbkshzxwyss.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXZoaW1pYnRia3Noenh3eXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODAxOTIsImV4cCI6MjA4NTc1NjE5Mn0.wOa0aQyp4kRh8v6ShncJ7fW6nV6hTTpOG4gw61WQrTM"; // 🔴 REQUIRED

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
let currentFilter = "ALL";
let priceMap = {};

/*************************************************
 * 🔐 AUTH FUNCTIONS
 *************************************************/
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    document.getElementById("authStatus").innerText =
      "Email aur password dono required hain";
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });

  document.getElementById("authStatus").innerText =
    error ? error.message : "Signup successful ✅ Ab login karo";
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // 🛡️ 1️⃣ ADMIN LOGIN (highest priority)
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    document.getElementById("authStatus").innerText =
      "Admin login successful ✅ (Dev Mode)";
    showDashboard(true);
    return;
  }

  // 🔐 2️⃣ SUPABASE LOGIN (future-ready)
  if (typeof supabase !== "undefined") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error) {
      document.getElementById("authStatus").innerText =
        "Login successful ✅";
      return;
    }
  }

  // ❌ 3️⃣ FAIL SAFE
  document.getElementById("authStatus").innerText =
    "Invalid credentials ❌";
}

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  document.getElementById("authStatus").innerText =
    error ? error.message : "Signup successful ✅";
}

async function logout() {
  await supabase.auth.signOut();
}

function logout() {
  showDashboard(false);
  document.getElementById("authStatus").innerText = "Logged out";
}


/*************************************************
 * 🔐 AUTH STATE LISTENER (SINGLE SOURCE OF TRUTH)
 *************************************************/
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    showDashboard(true);
    await loadWatchlist();
  } else {
    showDashboard(false);
    watchlist = [];
    renderWatchlist();
  }
});

function showDashboard(show) {
  document.getElementById("dashboard").style.display = show ? "block" : "none";
}

/*************************************************
 * 🧠 INDICATORS
 *************************************************/
function calculateRSI(prices) {
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    diff > 0 ? (gains += diff) : (losses -= diff);
  }
  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

function generatePriceHistory(base) {
  let prices = [base];
  for (let i = 0; i < 14; i++) {
    prices.push(prices[i] + (Math.random() - 0.5) * 20);
  }
  return prices;
}

/*************************************************
 * ⭐ WATCHLIST (SUPABASE)
 *************************************************/
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function loadWatchlist() {
  const user = await getUser();
  if (!user) return;

  const { data } = await supabase
    .from("watchlists")
    .select("symbol")
    .eq("user_id", user.id);

  watchlist = data.map(d => d.symbol);
  renderWatchlist();
  renderStocks(allStocks);
}

async function toggleWatchlist(symbol) {
  const user = await getUser();
  if (!user) {
    alert("Please login first");
    return;
  }

  if (watchlist.includes(symbol)) {
    await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    watchlist = watchlist.filter(s => s !== symbol);
  } else {
    await supabase.from("watchlists").insert([
      { user_id: user.id, symbol }
    ]);
    watchlist.push(symbol);
  }

  renderWatchlist();
  renderStocks(allStocks);
}

function renderWatchlist() {
  const div = document.getElementById("watchlist");
  if (!div) return;

  div.innerHTML =
    "<b>⭐ My Watchlist:</b><br>" +
    watchlist.map(s => s).join("<br>");
}

/*************************************************
 * 💰 LIVE PRICE (SIMULATED)
 *************************************************/
function getLivePrice(symbol) {
  if (!priceMap[symbol]) {
    priceMap[symbol] = 200 + Math.random() * 2000;
  }
  priceMap[symbol] += (Math.random() - 0.5) * 5;
  return priceMap[symbol].toFixed(2);
}

/*************************************************
 * 📊 LOAD STOCKS (JSON FOR NOW)
 *************************************************/
fetch("data/stocks.json")
  .then(res => res.json())
  .then(stocks => {
    allStocks = stocks.map(stock => {
      const history = generatePriceHistory(Math.random() * 2000 + 200);
      const rsi = calculateRSI(history);
      const momentum = history.at(-1) - history[0];

      let score = 50;
      if (rsi < 30) score += 25;
      if (rsi > 70) score -= 20;
      score += momentum > 0 ? 15 : -10;

      score = Math.max(0, Math.min(100, Math.round(score)));

      let signal =
        score >= 80 ? "Strong Buy" :
        score >= 65 ? "Buy" :
        score <= 35 ? "Sell" : "Hold";

      return { ...stock, score, signal, rsi, momentum };
    });

    renderStocks(allStocks);
    renderTop10();
  });

/*************************************************
 * 📈 RENDER UI
 *************************************************/
function renderStocks(stocks) {
  const container = document.getElementById("stocks");
  if (!container) return;

  container.innerHTML = "";

  stocks.forEach(stock => {
    const div = document.createElement("div");
    div.className = "stock";

    div.innerHTML = `
      <h3>${stock.name} (${stock.symbol})</h3>
      <p>Score: ${stock.score}</p>
      <p>Signal: ${stock.signal}</p>
      <p>Live Price: ₹${getLivePrice(stock.symbol)}</p>
      <button onclick="toggleWatchlist('${stock.symbol}')">
        ${watchlist.includes(stock.symbol) ? "Remove ⭐" : "Add ⭐"}
      </button>
    `;
    container.appendChild(div);
  });
}

function renderTop10() {
  const top = [...allStocks].sort((a,b)=>b.score-a.score).slice(0,10);
  document.getElementById("topPicks").innerHTML =
    "<b>🏆 Top 10 AI Picks</b><br>" +
    top.map(s=>`${s.name} (${s.score})`).join("<br>");
}

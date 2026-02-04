const SUPABASE_URL = "https://xfavhimibtbkshzxwyss.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* --------------------------
   Utilities & Indicators
   -------------------------- */
function calculateRSI(prices) {
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function generatePriceHistory(basePrice) {
  let prices = [basePrice];
  for (let i = 0; i < 14; i++) {
    let change = (Math.random() - 0.5) * 20;
    prices.push(prices[prices.length - 1] + change);
  }
  return prices;
}

/* --------------------------
   Watchlist (localStorage)
   -------------------------- */

function toggleWatchlist(symbol) {
  if (watchlist.includes(symbol)) {
    watchlist = watchlist.filter(s => s !== symbol);
  } else {
    watchlist.push(symbol);
  }
  renderStocks(allStocks);
  renderWatchlist();
}

function renderWatchlist() {
  const div = document.getElementById("watchlist");
  if (!div) return;
  let html = "<b>⭐ My Watchlist:</b><br>";
  watchlist.forEach(sym => html += sym + "<br>");
  div.innerHTML = html;
}

/* --------------------------
   Fake-but-realistic live price engine
   -------------------------- */
let priceMap = {};

function getLivePrice(symbol) {
  if (!priceMap[symbol]) {
    // different base for different symbols for variety
    priceMap[symbol] = 300 + (symbol.charCodeAt(0) % 1000) + Math.random() * 400;
  }
  return new Promise(resolve => {
    let change = (Math.random() - 0.5) * 5; // small tick
    priceMap[symbol] = Math.max(5, priceMap[symbol] + change);
    resolve(priceMap[symbol].toFixed(2));
  });
}

/* --------------------------
   Market + AI summary updates
   -------------------------- */
function updateMarket() {
  const nifty = (Math.random() * 200 - 100).toFixed(2); // demo NIFTY change
  const sentiment = nifty > 0 ? "Bullish 📈" : "Bearish 📉";
  const el = document.getElementById("marketBox");
  if (el) {
    el.innerHTML = `<b>NIFTY Change:</b> ${nifty} <br><b>Market Sentiment:</b> ${sentiment}`;
  }
}

function updateAIPrediction() {
  const bullishCount = allStocks.filter(s => s.trend === "Bullish").length;
  const total = allStocks.length || 1;
  const ratio = Math.round((bullishCount / total) * 100);
  let prediction = "Neutral";
  if (ratio > 60) prediction = "Market likely Bullish Tomorrow 🚀";
  else if (ratio < 40) prediction = "Market likely Bearish Tomorrow ⚠️";
  const el = document.getElementById("aiPrediction");
  if (el) {
    el.innerHTML = `<b>Bullish Stocks:</b> ${bullishCount}/${total} <br><b>AI Outlook:</b> ${prediction}`;
  }
}

/* --------------------------
   App state
   -------------------------- */
let allStocks = [];
let currentFilter = "ALL";

/* --------------------------
   Load stocks and compute AI
   -------------------------- */
fetch("data/stocks.json")
  .then(res => res.json())
  .then(stocks => {
    // compute AI values per stock
    allStocks = stocks.map(stock => {
      const basePrice = Math.random() * 2000 + 200;
      const history = generatePriceHistory(basePrice);
      const rsi = calculateRSI(history);
      const momentum = history[history.length - 1] - history[0];

      // base score and optional strategy adjustment (if dropdown present)
      let score = 50;
      const strategy = document.getElementById("strategyMode")?.value || "balanced";
      if (strategy === "aggressive") score += 10;
      if (strategy === "conservative") score -= 5;

      // RSI logic
      if (rsi < 30) score += 25;        // oversold => bullish
      else if (rsi > 70) score -= 20;   // overbought => bearish

      // Momentum logic
      if (momentum > 0) score += 15;
      else score -= 10;

      // Sector bias
      if (stock.sector === "Banking") score += 5;
      if (stock.sector === "IT") score += 3;

      // clamp
      score = Math.max(0, Math.min(100, Math.round(score)));

      let trend = "Neutral";
      if (score >= 70) trend = "Bullish";
      else if (score <= 40) trend = "Bearish";

      let signal = "Hold";
      if (score >= 80) signal = "Strong Buy";
      else if (score >= 65) signal = "Buy";
      else if (score <= 35) signal = "Sell";

      return {
        ...stock,
        score,
        trend,
        signal,
        rsi,
        momentum
      };
    });

    // All render calls MUST happen after allStocks is ready
    renderTop10();
    renderStocks(allStocks);
    renderAISignals();
    updateMarket();
    updateAIPrediction();
    renderSectorHeatmap();
    renderWatchlist();
    renderTomorrowPrediction();
    renderIndex();
    renderNewsSentiment();

    // default explanation — show first stock explanation
    if (allStocks.length) {
      renderAIExplanation(allStocks[0]);
    }

    // periodic updates
    setInterval(() => {
      updateMarket();
      updateAIPrediction();
    }, 30000);

  })
  .catch(err => {
    console.error("Error loading stocks:", err);
  });

/* --------------------------
   Render helpers
   -------------------------- */
function renderTop10() {
  const top10 = [...allStocks].sort((a, b) => b.score - a.score).slice(0, 10);
  let html = "<b>🏆 Top 10 AI Stocks Today:</b><br>";
  top10.forEach(s => html += `${s.name} (${s.symbol}) — ${s.score}<br>`);
  const el = document.getElementById("topPicks");
  if (el) el.innerHTML = html;
}

function renderStocks(stocks) {
  const container = document.getElementById("stocks");
  if (!container) return;
  container.innerHTML = "";

  stocks.forEach(stock => {
    const div = document.createElement("div");
    div.className = "stock";

    let trendClass = stock.trend.toLowerCase();

    div.innerHTML = `
      <h3 onclick="loadChart('${stock.symbol}'); renderAIExplanation(${JSON.stringify(stock)})" style="cursor:pointer;">
        ${stock.name} (${stock.symbol})
      </h3>
      <p>Sector: ${stock.sector}</p>
      <p>AI Score: ${stock.score}</p>
      <p>RSI: ${stock.rsi ? stock.rsi.toFixed(2) : "N/A"}</p>
      <p>Momentum: ${stock.momentum ? stock.momentum.toFixed(2) : "N/A"}</p>
      <p class="${trendClass}">Trend: ${stock.trend}</p>
      <p>Signal: ${stock.signal}</p>
      <p id="price-${stock.symbol}">Loading price...</p>
      <button onclick="toggleWatchlist('${stock.symbol}')">
        ${watchlist.includes(stock.symbol) ? "Remove ⭐" : "Add ⭐"}
      </button>
    `;

    container.appendChild(div);

    // update live price once per card (no duplicate calls)
    getLivePrice(stock.symbol).then(price => {
      const priceEl = document.getElementById(`price-${stock.symbol}`);
      if (priceEl) priceEl.innerText = "Live Price: ₹" + price;
    });
  });
}

function filterStocks(type) {
  currentFilter = type;
  applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
  // attach listeners if elements exist (guard to avoid errors)
  const searchBox = document.getElementById("searchBox");
  if (searchBox) searchBox.addEventListener("input", applyFilters);

  const sectorFilter = document.getElementById("sectorFilter");
  if (sectorFilter) sectorFilter.addEventListener("change", applyFilters);
});

function applyFilters() {
  let filtered = allStocks.slice();

  const searchText = document.getElementById("searchBox")?.value?.toLowerCase() || "";
  const sector = document.getElementById("sectorFilter")?.value || "ALL";

  if (searchText) {
    filtered = filtered.filter(stock =>
      stock.name.toLowerCase().includes(searchText) ||
      stock.symbol.toLowerCase().includes(searchText)
    );
  }

  if (sector !== "ALL") {
    filtered = filtered.filter(stock => stock.sector === sector);
  }

  if (currentFilter !== "ALL") {
    filtered = filtered.filter(stock =>
      stock.signal === currentFilter || stock.trend === currentFilter
    );
  }

  renderStocks(filtered);
}

/* --------------------------
   Signals, Heatmap, Predictions
   -------------------------- */
function renderAISignals() {
  const div = document.getElementById("aiSignals");
  if (!div) return;

  const strongBuy = allStocks.filter(s => s.signal === "Strong Buy").slice(0, 5);
  const sell = allStocks.filter(s => s.signal === "Sell").slice(0, 5);

  let html = "<b>🔥 Buy Today:</b><br>";
  strongBuy.forEach(s => html += `${s.name} (${s.symbol})<br>`);
  html += "<br><b>⚠️ Sell Today:</b><br>";
  sell.forEach(s => html += `${s.name} (${s.symbol})<br>`);

  div.innerHTML = html;
}

function renderSectorHeatmap() {
  const sectorDiv = document.getElementById("sectorHeatmap");
  if (!sectorDiv) return;

  const sectors = {};
  allStocks.forEach(s => {
    if (!sectors[s.sector]) sectors[s.sector] = { total: 0, bullish: 0 };
    sectors[s.sector].total++;
    if (s.trend === "Bullish") sectors[s.sector].bullish++;
  });

  let html = "";
  for (let sector in sectors) {
    const ratio = (sectors[sector].bullish / sectors[sector].total * 100).toFixed(0);
    const color = ratio > 60 ? "green" : ratio < 40 ? "red" : "orange";
    html += `<div style="margin:5px;padding:5px;border:1px solid #333;color:${color}">
      ${sector}: ${ratio}% Bullish
    </div>`;
  }

  sectorDiv.innerHTML = html;
}

function renderTomorrowPrediction() {
  const bullish = allStocks.filter(s => s.trend === "Bullish").length;
  const total = allStocks.length || 1;
  const probability = Math.round((bullish / total) * 100);

  let outlook = "Sideways";
  if (probability > 60) outlook = "Bullish 📈";
  else if (probability < 40) outlook = "Bearish 📉";

  const el = document.getElementById("tomorrowPrediction");
  if (el) {
    el.innerHTML = `<b>Market Outlook:</b> ${outlook}<br><b>Confidence:</b> ${probability}%`;
  }
}

/* --------------------------
   Portfolio Simulator
   -------------------------- */
function simulatePortfolio() {
  const amount = Number(document.getElementById("investmentAmount")?.value || 0);
  if (!amount || watchlist.length === 0) {
    document.getElementById("portfolioResult").innerText = "Enter amount & add stocks to watchlist";
    return;
  }

  let gain = 0;
  watchlist.forEach(sym => {
    const stock = allStocks.find(s => s.symbol === sym);
    if (!stock) return;
    if (stock.signal === "Strong Buy") gain += amount * 0.08;
    else if (stock.signal === "Buy") gain += amount * 0.04;
    else if (stock.signal === "Sell") gain -= amount * 0.03;
  });

  document.getElementById("portfolioResult").innerHTML = `<b>Estimated P/L:</b> ₹${gain.toFixed(0)}`;
}

/* --------------------------
   Index, Top picks & Explanation
   -------------------------- */
function renderIndex() {
  const nifty = (Math.random() * 200 - 100).toFixed(2);
  const bank = (Math.random() * 200 - 100).toFixed(2);
  const el = document.getElementById("indexBox");
  if (el) el.innerHTML = `NIFTY: ${nifty} <br> BANKNIFTY: ${bank}`;
}

function renderAIExplanation(stock) {
  if (!stock) {
    document.getElementById("aiExplanation") && (document.getElementById("aiExplanation").innerText = "Click any stock to see explanation.");
    return;
  }
  let reasons = [];
  if (stock.rsi < 30) reasons.push("RSI oversold (bullish signal)");
  if (stock.rsi > 70) reasons.push("RSI overbought (risk)");
  if (stock.momentum > 0) reasons.push("Positive momentum");
  if (stock.momentum < 0) reasons.push("Negative momentum");
  if (stock.sector === "Banking") reasons.push("Strong banking sector bias");

  document.getElementById("aiExplanation") && (document.getElementById("aiExplanation").innerHTML = `
    <b>${stock.name} (${stock.symbol})</b><br>
    Signal: ${stock.signal}<br>
    Reasons:<br>• ${reasons.join("<br>• ")}
  `);
}

/* --------------------------
   News, Backtest
   -------------------------- */
function renderNewsSentiment() {
  const sentiments = ["Positive 🟢", "Neutral 🟡", "Negative 🔴"];
  const pick = sentiments[Math.floor(Math.random() * sentiments.length)];
  const el = document.getElementById("newsSentiment");
  if (el) el.innerHTML = `Market News Sentiment: <b>${pick}</b>`;
}

function runBacktest() {
  let profit = 0;
  allStocks.forEach(stock => {
    if (stock.signal === "Strong Buy") profit += 5;
    if (stock.signal === "Buy") profit += 2;
    if (stock.signal === "Sell") profit -= 3;
  });
  const el = document.getElementById("backtestResult");
  if (el) el.innerHTML = `<b>Backtest Result:</b><br>Strategy Return: ${profit}%`;
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById("authStatus").innerText = error.message;
  } else {
    document.getElementById("authStatus").innerText = "Logged in ✅";
  }
}

loadWatchlist();

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
  renderStocks(allStocks);
  renderWatchlist();
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
    await supabase
      .from("watchlists")
      .insert([{ user_id: user.id, symbol }]);

    watchlist.push(symbol);
  }

  renderStocks(allStocks);
  renderWatchlist();
}

function showDashboard(show) {
  document.getElementById("dashboard").style.display = show ? "block" : "none";
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    showDashboard(true);
    loadWatchlist();
  } else {
    showDashboard(false);
  }
});


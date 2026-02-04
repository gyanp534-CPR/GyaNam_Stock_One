/*************************************************
 * 🌍 GLOBAL STATE
 *************************************************/
let allStocks = [];
let watchlist = [];
let priceMap = {};
let currentFilter = "ALL";

/*************************************************
 * 🧠 UTILITIES
 *************************************************/
function calculateRSI(prices) {
  let gains = 0, losses = 0;
  for (let i = 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    diff > 0 ? gains += diff : losses -= diff;
  }
  let rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function generatePriceHistory(base) {
  let prices = [base];
  for (let i = 0; i < 14; i++) {
    prices.push(prices[i] + (Math.random() - 0.5) * 20);
  }
  return prices;
}

/*************************************************
 * 💰 SIMULATED LIVE PRICE
 *************************************************/
function getLivePrice(symbol) {
  if (!priceMap[symbol]) {
    priceMap[symbol] = 200 + Math.random() * 2000;
  }
  priceMap[symbol] += (Math.random() - 0.5) * 5;
  return priceMap[symbol].toFixed(2);
}

/*************************************************
 * 📊 MARKET + AI SUMMARY
 *************************************************/
function updateMarket() {
  const nifty = (Math.random() * 200 - 100).toFixed(2);
  document.getElementById("marketBox").innerHTML =
    `<b>NIFTY:</b> ${nifty} (${nifty > 0 ? "Bullish 📈" : "Bearish 📉"})`;
}

function updateAIPrediction() {
  const bullish = allStocks.filter(s => s.trend === "Bullish").length;
  const total = allStocks.length || 1;
  const ratio = Math.round(bullish / total * 100);

  let outlook = "Neutral";
  if (ratio > 60) outlook = "Bullish 🚀";
  if (ratio < 40) outlook = "Bearish ⚠️";

  document.getElementById("aiPrediction").innerHTML =
    `Bullish Stocks: ${bullish}/${total}<br>AI Outlook: <b>${outlook}</b>`;
}

function renderTomorrowPrediction() {
  const bullish = allStocks.filter(s => s.trend === "Bullish").length;
  const prob = Math.round(bullish / allStocks.length * 100);
  document.getElementById("tomorrowPrediction").innerHTML =
    `Tomorrow Probability: <b>${prob}%</b>`;
}

function renderIndex() {
  document.getElementById("indexBox").innerHTML =
    `NIFTY: ${(Math.random() * 200 - 100).toFixed(2)}<br>
     BANKNIFTY: ${(Math.random() * 200 - 100).toFixed(2)}`;
}

/*************************************************
 * ⭐ WATCHLIST (LOCAL)
 *************************************************/
function toggleWatchlist(symbol) {
  if (watchlist.includes(symbol))
    watchlist = watchlist.filter(s => s !== symbol);
  else
    watchlist.push(symbol);

  renderWatchlist();
  renderStocks(allStocks);
}

function renderWatchlist() {
  document.getElementById("watchlist").innerHTML =
    watchlist.length ? watchlist.join("<br>") : "Empty";
}

/*************************************************
 * 📊 RENDER STOCKS
 *************************************************/
function renderStocks(stocks) {
  const container = document.getElementById("stocks");
  container.innerHTML = "";

  stocks.forEach(stock => {
    const div = document.createElement("div");
    div.className = "stock";
    div.innerHTML = `
      <b>${stock.name} (${stock.symbol})</b><br>
      Sector: ${stock.sector}<br>
      AI Score: ${stock.score}<br>
      RSI: ${stock.rsi.toFixed(1)}<br>
      Trend: <span class="${stock.trend.toLowerCase()}">${stock.trend}</span><br>
      Signal: ${stock.signal}<br>
      Live Price: ₹${getLivePrice(stock.symbol)}<br>
      <button onclick="toggleWatchlist('${stock.symbol}')">
        ${watchlist.includes(stock.symbol) ? "Remove ⭐" : "Add ⭐"}
      </button>
    `;
    container.appendChild(div);
  });
}

function renderTopPicks() {
  const top = [...allStocks].sort((a, b) => b.score - a.score).slice(0, 5);
  document.getElementById("topPicks").innerHTML =
    top.map(s => `${s.name} (${s.score})`).join("<br>");
}

function renderAISignals() {
  const buys = allStocks.filter(s => s.signal === "Strong Buy").slice(0, 5);
  document.getElementById("aiSignals").innerHTML =
    buys.length ? buys.map(s => s.name).join("<br>") : "No strong buys today";
}

function renderSectorHeatmap() {
  const map = {};
  allStocks.forEach(s => {
    if (!map[s.sector]) map[s.sector] = { t: 0, b: 0 };
    map[s.sector].t++;
    if (s.trend === "Bullish") map[s.sector].b++;
  });

  document.getElementById("sectorHeatmap").innerHTML =
    Object.keys(map).map(sec => {
      let r = Math.round(map[sec].b / map[sec].t * 100);
      return `${sec}: ${r}% Bullish`;
    }).join("<br>");
}

/*************************************************
 * 🚀 INIT STOCK DATA
 *************************************************/
const rawStocks = [
  { name: "Reliance", symbol: "RELIANCE", sector: "Energy" },
  { name: "TCS", symbol: "TCS", sector: "IT" },
  { name: "HDFC Bank", symbol: "HDFCBANK", sector: "Banking" },
  { name: "Infosys", symbol: "INFY", sector: "IT" }
];

allStocks = rawStocks.map(s => {
  const hist = generatePriceHistory(Math.random() * 2000 + 200);
  const rsi = calculateRSI(hist);
  const momentum = hist.at(-1) - hist[0];

  let score = 50;
  if (rsi < 30) score += 25;
  if (rsi > 70) score -= 20;
  score += momentum > 0 ? 15 : -10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let trend = score >= 70 ? "Bullish" : score <= 40 ? "Bearish" : "Neutral";
  let signal = score >= 80 ? "Strong Buy" :
               score >= 65 ? "Buy" :
               score <= 35 ? "Sell" : "Hold";

  return { ...s, score, trend, signal, rsi, momentum };
});

/*************************************************
 * ▶️ START APP
 *************************************************/
renderIndex();
updateMarket();
updateAIPrediction();
renderTomorrowPrediction();
renderStocks(allStocks);
renderTopPicks();
renderAISignals();
renderSectorHeatmap();
renderWatchlist();

setInterval(() => {
  updateMarket();
  updateAIPrediction();
}, 30000);

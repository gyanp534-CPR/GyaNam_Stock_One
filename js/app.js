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

let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

function toggleWatchlist(symbol) {
  if (watchlist.includes(symbol)) {
    watchlist = watchlist.filter(s => s !== symbol);
  } else {
    watchlist.push(symbol);
  }
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
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

function getLivePrice(symbol) {
  return new Promise(resolve => {
    const base = Math.random() * 2000 + 200;
    resolve(base.toFixed(2));
  });
}

function updateMarket() {
  const nifty = (Math.random() * 200 - 100).toFixed(2); // demo NIFTY change
  const sentiment = nifty > 0 ? "Bullish 📈" : "Bearish 📉";

  document.getElementById("marketBox").innerHTML = `
    <b>NIFTY Change:</b> ${nifty} <br>
    <b>Market Sentiment:</b> ${sentiment}
  `;
}

function updateAIPrediction() {
  const bullishCount = allStocks.filter(s => s.trend === "Bullish").length;
  const total = allStocks.length;
  const ratio = (bullishCount / total * 100).toFixed(0);

  let prediction = "Neutral";
  if (ratio > 60) prediction = "Market likely Bullish Tomorrow 🚀";
  else if (ratio < 40) prediction = "Market likely Bearish Tomorrow ⚠️";

  document.getElementById("aiPrediction").innerHTML = `
    <b>Bullish Stocks:</b> ${bullishCount}/${total} <br>
    <b>AI Outlook:</b> ${prediction}
  `;
}

let allStocks = [];
let currentFilter = "ALL";

fetch("data/stocks.json")
  .then(res => res.json())
  .then(stocks => {
    allStocks = stocks.map(stock => {
      const basePrice = Math.random() * 2000 + 200;
const history = generatePriceHistory(basePrice);
const rsi = calculateRSI(history);

let momentum = history[history.length - 1] - history[0];

let score = 50;

// RSI logic
if (rsi < 30) score += 25;        // oversold → bullish
else if (rsi > 70) score -= 20;   // overbought → bearish

// Momentum logic
if (momentum > 0) score += 15;
else score -= 10;

// Sector bonus (AI bias)
if (stock.sector === "Banking") score += 5;
if (stock.sector === "IT") score += 3;

// Final clamp
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
;
    });

    renderTopPicks();
    renderStocks(allStocks);
    renderAISignals();
    updateMarket();
    updateAIPrediction();
    renderSectorHeatmap();
    renderWatchlist();   // 👈 ADD THIS


  });

function renderTopPicks() {
  const topDiv = document.getElementById("topPicks");
  topDiv.innerHTML = "";

  setInterval(() => {
  updateMarket();
  updateAIPrediction();
}, 30000); // every 30 seconds

  const topStocks = [...allStocks]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  topStocks.forEach(stock => {
    topDiv.innerHTML += `<p>${stock.name} (${stock.symbol}) - Score: ${stock.score} - <span class="bullish">${stock.signal}</span></p>`;
  });
}

function renderStocks(stocks) {
  const container = document.getElementById("stocks");
  container.innerHTML = "";

  stocks.forEach(stock => {
    const div = document.createElement("div");
    div.className = "stock";

    let trendClass = stock.trend.toLowerCase();

    div.innerHTML = `
  <h3 onclick="loadChart('${stock.symbol}')" style="cursor:pointer;">
  ${stock.name} (${stock.symbol})
</h3>

  <p>Sector: ${stock.sector}</p><p>AI Score: ${stock.score}</p>
<p>RSI: ${stock.rsi ? stock.rsi.toFixed(2) : "N/A"}</p>
<p>Momentum: ${stock.momentum ? stock.momentum.toFixed(2) : "N/A"}</p>

  <p class="${trendClass}">Trend: ${stock.trend}</p>
  <p>Signal: ${stock.signal}</p>
  <p id="price-${stock.symbol}">Loading price...</p>
  <button onclick="toggleWatchlist('${stock.symbol}')">
    ${watchlist.includes(stock.symbol) ? "Remove ⭐" : "Add ⭐"}
  </button>
`;

getLivePrice(stock.symbol).then(price => {
  if (price) {
    document.getElementById(`price-${stock.symbol}`).innerText = "Live Price: ₹" + price;
  } else {
    document.getElementById(`price-${stock.symbol}`).innerText = "Price unavailable";
  }
});


    container.appendChild(div);
    getLivePrice(stock.symbol).then(price => {
  document.getElementById(`price-${stock.symbol}`).innerText = "Live Price: ₹" + price;
});

  });
}

function filterStocks(type) {
  currentFilter = type;
  applyFilters();
}

document.getElementById("searchBox").addEventListener("input", applyFilters);
document.getElementById("sectorFilter").addEventListener("change", applyFilters);

function applyFilters() {
  let filtered = allStocks;

  const searchText = document.getElementById("searchBox").value.toLowerCase();
  const sector = document.getElementById("sectorFilter").value;

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

  function renderAISignals() {
  const div = document.getElementById("aiSignals");

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

}

async function getLivePrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}.NS`;
    const res = await fetch(url);
    const data = await res.json();
    return data.quoteResponse.result[0].regularMarketPrice;
  } catch (e) {
    return null;
  }
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
      let score = 50;

      if (stock.change > 2) score += 25;
      else if (stock.change > 0) score += 15;
      else score += 5;

      score += Math.floor(Math.random() * 20);

      let trend = "Neutral";
      if (score >= 75) trend = "Bullish";
      else if (score < 50) trend = "Bearish";

      let signal = "Hold";
      if (score >= 80) signal = "Strong Buy";
      else if (score >= 65) signal = "Buy";
      else if (score < 50) signal = "Sell";

      return { ...stock, score, trend, signal };
    });

    renderTopPicks();
    renderStocks(allStocks);
    renderAISignals();
    updateMarket();
    updateAIPrediction();
    renderSectorHeatmap();
    


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
  <h3>${stock.name} (${stock.symbol})</h3>
  <p>Sector: ${stock.sector}</p>
  <p>AI Score: ${stock.score}</p>
  <p class="${trendClass}">Trend: ${stock.trend}</p>
  <p>Signal: ${stock.signal}</p>
  <p id="price-${stock.symbol}">Loading price...</p>
`;
getLivePrice(stock.symbol).then(price => {
  if (price) {
    document.getElementById(`price-${stock.symbol}`).innerText = "Live Price: ₹" + price;
  } else {
    document.getElementById(`price-${stock.symbol}`).innerText = "Price unavailable";
  }
});


    container.appendChild(div);
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

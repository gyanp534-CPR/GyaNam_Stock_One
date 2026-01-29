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

    renderStocks(allStocks);
  });

function renderStocks(stocks) {
  const container = document.getElementById("stocks");
  container.innerHTML = "";

  stocks.forEach(stock => {
    const div = document.createElement("div");
    div.className = "stock";

    div.innerHTML = `
      <h3>${stock.name} (${stock.symbol})</h3>
      <p>AI Score: ${stock.score}</p>
      <p>Trend: ${stock.trend}</p>
      <p>Signal: ${stock.signal}</p>
    `;

    container.appendChild(div);
  });
}

function filterStocks(type) {
  currentFilter = type;
  applyFilters();
}

document.getElementById("searchBox").addEventListener("input", applyFilters);

function applyFilters() {
  let filtered = allStocks;

  const searchText = document.getElementById("searchBox").value.toLowerCase();

  if (searchText) {
    filtered = filtered.filter(stock =>
      stock.name.toLowerCase().includes(searchText) ||
      stock.symbol.toLowerCase().includes(searchText)
    );
  }

  if (currentFilter !== "ALL") {
    filtered = filtered.filter(stock =>
      stock.signal === currentFilter || stock.trend === currentFilter
    );
  }

  renderStocks(filtered);
}

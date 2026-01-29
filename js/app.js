fetch("data.json")
  .then(response => response.json())
  .then(stocks => {
    const container = document.getElementById("stocks");

    stocks.forEach(stock => {
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

      const div = document.createElement("div");
      div.className = "stock";

      div.innerHTML = `
        <h3>${stock.name} (${stock.symbol})</h3>
        <p>AI Score: ${score}</p>
        <p>Trend: ${trend}</p>
        <p>Signal: ${signal}</p>
      `;

      container.appendChild(div);
    });
  })
  .catch(error => console.error("Error loading data:", error));

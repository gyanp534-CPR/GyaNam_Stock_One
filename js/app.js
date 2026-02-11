/*************************************************
 SUPABASE CONNECTION (ONLY ONCE)
*************************************************/
const SUPABASE_URL = "https://xfavhimibtbkshzxwyss.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXZoaW1pYnRia3Noenh3eXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODAxOTIsImV4cCI6MjA4NTc1NjE5Mn0.wOa0aQyp4kRh8v6ShncJ7fW6nV6hTTpOG4gw61WQrTM";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("Supabase connected");


/*************************************************
 GLOBAL STATE
*************************************************/
let allStocks = [];


/*************************************************
 LOAD STOCKS FROM SUPABASE
*************************************************/
async function loadStocks() {
  document.getElementById("status").innerText = "Fetching from Supabase...";

  const { data, error } = await supabase
    .from("stocks")
    .select("*");

  if (error) {
    console.error(error);
    document.getElementById("status").innerText =
      "Error loading stocks from Supabase";
    return;
  }

  allStocks = data;

  document.getElementById("status").innerText =
    "Loaded " + allStocks.length + " stocks from Supabase";

  calculateAI();
  renderStocks();
  renderTop10();
}


/*************************************************
 AI SCORE CALCULATION
*************************************************/
function calculateAI() {
  allStocks = allStocks.map(stock => {

    let score = 50 + Math.floor(Math.random() * 50);

    let signal =
      score > 80 ? "Strong Buy" :
      score > 65 ? "Buy" :
      score < 35 ? "Sell" :
      "Hold";

    return {
      ...stock,
      score,
      signal
    };
  });
}


/*************************************************
 RENDER ALL STOCKS
*************************************************/
function renderStocks() {
  const container = document.getElementById("stocks");
  container.innerHTML = "";

  allStocks.forEach(stock => {
    container.innerHTML += `
      <div style="margin-bottom:10px;">
        <b>${stock.name} (${stock.symbol})</b><br>
        Sector: ${stock.sector}<br>
        AI Score: ${stock.score}<br>
        Signal: ${stock.signal}
      </div>
      <hr>
    `;
  });
}


/*************************************************
 TOP 10
*************************************************/
function renderTop10() {
  const top = [...allStocks]
    .sort((a,b) => b.score - a.score)
    .slice(0,10);

  document.getElementById("topPicks").innerHTML =
    top.map(s => `${s.name} (${s.score})`).join("<br>");
}


/*************************************************
 START APP
*************************************************/
loadStocks();

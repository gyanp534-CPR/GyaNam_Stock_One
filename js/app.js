/*************************************************
 * 🔐 SUPABASE CONFIG (PUBLIC READ ONLY)
 *************************************************/
const SUPABASE_URL = "https://xfavhimibtbkshzxwyss.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXZoaW1pYnRia3Noenh3eXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODAxOTIsImV4cCI6MjA4NTc1NjE5Mn0.wOa0aQyp4kRh8v6ShncJ7fW6nV6hTTpOG4gw61WQrTM";

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/*************************************************
 * 🌍 STATE
 *************************************************/
let stocks = [];

/*************************************************
 * 📊 FETCH FROM SUPABASE
 *************************************************/
async function fetchStocks() {
  console.log("Fetching stocks from Supabase…");

  const { data, error } = await supabase
    .from("stocks")
    .select("symbol, name, sector");

  if (error) {
    console.error("Supabase error:", error);
    document.getElementById("stocks").innerText =
      "❌ Failed to load stocks. Check RLS / table.";
    return;
  }

  console.log("Stocks received:", data);
  stocks = data;
  renderStocks();
}

/*************************************************
 * 🖥️ RENDER
 *************************************************/
function renderStocks() {
  const container = document.getElementById("stocks");
  container.innerHTML = "";

  if (!stocks.length) {
    container.innerText = "No stocks found.";
    return;
  }

  stocks.forEach(s => {
    const div = document.createElement("div");
    div.className = "stock";
    div.innerHTML = `
      <b>${s.name} (${s.symbol})</b><br>
      Sector: ${s.sector}
    `;
    container.appendChild(div);
  });
}

/*************************************************
 * ▶️ START APP
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  fetchStocks();
});

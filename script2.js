// ===== Early sanity/debug logs =====
console.log("script.js loaded");
console.log("scene title element:", document.getElementById("scenes-title"));
console.log("group selector element:", document.getElementById("groups"));

// ===== Data groups =====
const stocks = ["S&P_500_Price", "Nasdaq_100_Price"];
const oil = ["Natural_Gas_Price", "Crude_Oil_Price"];
const commodities = ["Copper_Price", "Platinum_Price", "Silver_Price", "Gold_Price"];

function getNames(groupName) {
  if (groupName === "stocks") return stocks;
  else if (groupName === "oil") return oil;
  else if (groupName === "commodities") return commodities;
  else return [];
}

// ===== Scenes (martini glass) =====
const scenes = [
  { id: "stocks", title: "Stocks", text: "Stock Trends from 2020-2024", keys: stocks },
  { id: "oil", title: "Oil & Gas Prices", text: "Oil & Gas Prices from 2020-2024", keys: oil },
  { id: "commodities", title: "Commodity Prices", text: "Commodity Prices from 2020-2024", keys: commodities }
];
let current = 0;

// ===== Layout/template =====
const svg = d3.select("#chart");
const margin = { top: 30, right: 100, bottom: 60, left: 70 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const allKeys = [...stocks, ...oil, ...commodities];
const color = d3.scaleOrdinal().domain(allKeys).range(d3.schemeTableau10); // correct spelling

const xAxisG = g.append("g").attr("transform", `translate(0, ${height})`);
const yAxisG = g.append("g");

// axis labels
g.append("text")
  .attr("class", "axis-label")
  .attr("x", width / 2)
  .attr("y", height + 45)
  .attr("text-anchor", "middle")
  .text("Date");

g.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .text("Price ($)");

// ===== Data loader =====
let data = [];
async function getData() {
  try {
    data = await d3.csv("US_Stock_Data.csv", d => {
      d.Date = new Date(d.Date);
      d["S&P_500_Price"] = +d["S&P_500_Price"];
      d["Nasdaq_100_Price"] = +d["Nasdaq_100_Price"];
      d["Natural_Gas_Price"] = +d["Natural_Gas_Price"];
      d["Crude_Oil_Price"] = +d["Crude_Oil_Price"];
      d["Copper_Price"] = +d["Copper_Price"];
      d["Platinum_Price"] = +d["Platinum_Price"];
      d["Silver_Price"] = +d["Silver_Price"];
      d["Gold_Price"] = +d["Gold_Price"];
      return d;
    });

    if (!data.length) throw new Error("CSV is empty.");
    // sort by date for proper line drawing
    data.sort((a, b) => a.Date - b.Date);

    console.log("Data loaded, sample row:", data[0]);
  } catch (err) {
    console.error("Failed to load data:", err);
    d3.select("body").append("div")
      .style("color", "red")
      .text("Error loading data: " + err.message);
  }
}

// ===== Chart rendering =====
function createCharts(keys) {
  if (!data || !keys || keys.length === 0) {
    console.warn("Skipping chart: missing data or keys", { data, keys });
    return;
  }

  // debug current state
  console.log("Entering createCharts with keys:", keys);
  console.log("Data length:", data.length);
  console.log("First date valid:", data[0] && data[0].Date instanceof Date);
  console.log("Example values for first row:", keys.map(k => [k, data[0][k]]));

  // compute domains avoiding NaN
  x.domain(d3.extent(data, d => d.Date));
  const yMax = d3.max(data, d =>
    d3.max(keys, k => (isNaN(d[k]) ? -Infinity : d[k]))
  );
  y.domain([0, yMax]).nice();

  console.log("x domain:", x.domain(), "y domain:", y.domain());

  // draw axes
  xAxisG.call(d3.axisBottom(x));
  yAxisG.call(d3.axisLeft(y));

  // clear previous visual marks
  g.selectAll(".series").remove();
  g.selectAll(".annotation").remove();

  // draw each series with defined to skip missing
  keys.forEach((key, idx) => {
    const lineGen = d3.line()
      .defined(d => !isNaN(d[key]) && d[key] != null)
      .curve(d3.curveMonotoneX) // smoother
      .x(d => x(d.Date))
      .y(d => y(d[key]));

    g.append("path")
      .datum(data)
      .attr("class", "series")
      .attr("fill", "none")
      .attr("stroke", color(key))
      .attr("stroke-width", 2)
      .attr("d", lineGen);

    // log path existence
    const lastValid = [...data].reverse().find(d => !isNaN(d[key]) && d[key] != null);
    if (!lastValid) {
      console.warn("No valid last point for key:", key);
      return;
    }

    // inline label at the most recent valid point
    g.append("text")
      .attr("class", "annotation")
      .attr("x", x(lastValid.Date) + 6)
      .attr("y", y(lastValid[key]))
      .text(key.replace("_Price", ""))
      .attr("fill", color(key))
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    // primary annotation for first series
    if (idx === 0) {
      g.append("circle")
        .attr("class", "annotation")
        .attr("cx", x(lastValid.Date))
        .attr("cy", y(lastValid[key]))
        .attr("r", 5)
        .attr("fill", color(key));
      g.append("text")
        .attr("class", "annotation")
        .attr("x", x(lastValid.Date) + 6)
        .attr("y", y(lastValid[key]) - 8)
        .text(`${key.replace("_Price", "")} latest`)
        .attr("fill", color(key))
        .style("font-size", "11px");
    }
  });

  // inspect drawn paths
  g.selectAll("path.series").each(function(_, i) {
    const dAttr = this.getAttribute("d");
    console.log(`Path ${i} d length:`, dAttr ? dAttr.length : "none");
  });
}

// ===== Scene logic =====
function getScene() {
  if (!data) {
    console.warn("No data yet in getScene");
    return;
  }

  console.log("=== getScene debug ===");
  console.log("current scene index:", current);
  const isExploration = current >= scenes.length;
  let keys, title, text;

  if (!isExploration) {
    const scene = scenes[current];
    keys = scene.keys;
    title = scene.title;
    text = scene.text;
    d3.select("#explore").style("display", "none");
  } else {
    const selected = d3.select("#groups").node().value;
    keys = getNames(selected);
    title = `View the ${selected.charAt(0).toUpperCase() + selected.slice(1)}`;
    text = "Free-form comparison after the guided story.";
    d3.select("#explore").style("display", "inline-block");
  }

  console.log("Active keys for scene:", keys);
  d3.select("#scenes-title").text(title);
  d3.select("#scenes-text").text(text);

  createCharts(keys);

  d3.select("#back").attr("disabled", current === 0 ? true : null);
  d3.select("#next").attr("disabled", current > scenes.length ? true : null);
}

// ===== Triggers =====
d3.select("#next").on("click", () => {
  if (current <= scenes.length) current += 1;
  getScene();
});
d3.select("#back").on("click", () => {
  if (current > 0) current -= 1;
  getScene();
});
d3.select("#groups").on("change", () => {
  if (current >= scenes.length) getScene();
});

// ===== Init =====
(async () => {
  await getData();
  getScene();

  // fallback single-series test if nothing rendered
  setTimeout(() => {
    if (data && data.length && d3.selectAll("path.series").size() === 0) {
      console.warn("No series drawn; forcing fallback to Tesla_Price");
      createCharts(["Tesla_Price"]);
    }
  }, 500);
})();

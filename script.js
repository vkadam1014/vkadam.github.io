const stocks = ["Microsoft_Price", "Tesla_Price", "Apple_Price"];
const oil = ["Natural_Gas_Price"];
const commodities = ["Platinum_Price", "Silver_Price"];

function getNums(numbers){
  if (numbers == null){
    return NaN;
  }
  return +numbers.toString().replace('/./g', "");
}
var getSlashes = d3.timeParse("%m/%d/%y");
var getDash = d3.timeParse("%d-%m-%Y");

function getDates(date){
  var d = getSlashes(date);
  if(d){
    return d;
  }
  d = getDash(date);
  if(d){
    return d;
  }
  var normal = new Date(date);
  return isNaN(normal) ? null : normal;
}

function getNames(groupName) {
  if (groupName === "stocks"){
    return stocks;
  } 
  else if (groupName === "oil"){
    return oil;
  } 
  else{
    return commodities;
  }
}

const scenes = [
  { id: "stocks", title: "Stocks", text: "Stock Trends from 2020-2024", keys: stocks },
  { id: "oil", title: "Oil Prices", text: "Oil Prices from 2020-2024", keys: oil },
  { id: "commodities", title: "Commodity Prices", text: "Commodity Prices from 2020-2024", keys: commodities }
];
let current = 0;

var svg = d3.select("#chart");
var margin = { top: 30, right: 70, bottom: 100, left: 50 };
var width = +svg.attr("width") - margin.left - margin.right;
var height = +svg.attr("height") - margin.top - margin.bottom;

var g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 20]);

var allKey = [...stocks, ...oil, ...commodities];
const color = d3.scaleOrdinal().domain(allKey).range(d3.schemeTableau10); 

var xAxis = g.append("g").attr("transform", `translate(0, ${height})`);
var yAxis = g.append("g");


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


let data = [];
async function getData() {
  try {
    data = await d3.csv("US_Stock_Data.csv", d => {
      d.Date = getDates(d.Date);
      d["Microsoft_Price"] = +d["Microsoft_Price"];
      d["Tesla_Price"] = +d["Tesla_Price"];
      d["Apple_Price"] = +d["Apple_Price"];
      d["Natural_Gas_Price"] = +d["Natural_Gas_Price"];
      d["Platinum_Price"] = +d["Platinum_Price"];
      d["Silver_Price"] = +d["Silver_Price"];
      return d;
    });
    data = data.filter(d => d.Date && !isNaN(d.Date));
    data.sort((a,b) => a.Date - b.Date);
  } catch (err) {
    console.error("Data load failed:", err);
    d3.select("body").append("div")
      .style("color", "red")
      .text("Error loading data: " + err.message);
  }
}


function createCharts(keys) {
  if (!data || !keys || keys.length === 0) {
    return;
  }

  x.domain(d3.extent(data, d => d.Date));
  y.domain([
    0,
    d3.max(data, d => d3.max(keys, key => d[key]))
  ]).nice();



  xAxis.call(d3.axisBottom(x));
  yAxis.call(d3.axisLeft(y));


  g.selectAll(".series").remove();
  g.selectAll(".annotation").remove();


  keys.forEach((i, j) => {
    const lineGen = d3.line()
      .defined(d => !isNaN(d[i] && d[i] != null))
      .curve(d3.curveMonotoneX)
      .x(d => x(d.Date))
      .y(d => y(d[i]));

    g.append("path")
      .datum(data)
      .attr("class", "series")
      .attr("fill", "none")
      .attr("stroke", color(i))
      .attr("stroke-width", 2)
      .attr("d", lineGen);

    const last = data[data.length - 1];


    g.append("text")
      .attr("class", "annotation")
      .attr("x", x(last.Date) + 6)
      .attr("y", y(last[i]))
      .text(i.replace("_Price", ""))
      .attr("fill", color(i))
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");

    
    if (j === 0) {
      g.append("circle")
        .attr("class", "annotation")
        .attr("cx", x(last.Date))
        .attr("cy", y(last[i]))
        .attr("r", 5)
        .attr("fill", color(i));
      g.append("text")
        .attr("class", "annotation")
        .attr("x", x(last.Date) + 6)
        .attr("y", y(last[i]) - 8)
        .text(`${i.replace("_Price", "")}`)
        .text(`${i.replace("_Oil"), ""}`)
        .text(`${i.replace("_Gas"), ""}`)
        .attr("fill", color(i))
        .style("font-size", "10px");
    }
  });
}


function getScene() {
  if (!data){
    return;
  } 

  const navigate = current >= scenes.length;
  let keys, title, text;

  if (!navigate) {
    const scene = scenes[current];
    keys = scene.keys;
    title = scene.title;
    text = scene.text;
    d3.select("#explore").style("display", "none");
  } else {
    const selected = d3.select("#groups").node().value;
    keys = getNames(selected);
    title = `View the ${selected.charAt(0).toUpperCase() + selected.slice(1)} Prices`;
    text = "Feel free to use the dropdown to see the trends.";
    d3.select("#explore").style("display", "inline-block");
  }

  d3.select("#scenes-title").text(title);
  d3.select("#scenes-text").text(text);

  createCharts(keys);

  d3.select("#back").attr("disabled", current === 0 ? true : null);
  d3.select("#next").attr("disabled", current > scenes.length ? true : null);
}


d3.select("#next").on("click", () => {
  if (current <= scenes.length){
    current += 1;
  } 
  getScene();
});
d3.select("#back").on("click", () => {
  if (current > 0){
    current -= 1;
  } 
  getScene();
});
d3.select("#groups").on("change", () => {
  if (current >= scenes.length){
    getScene();
  } 
});
(async () => {
  await getData();
  getScene();
})();

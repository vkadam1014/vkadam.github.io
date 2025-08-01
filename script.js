const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const width = 960 - margin.left - margin.right;
const height = 640 - margin.top - margin.bottom;

var svg = d3.select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
;


let stock_data;

//Retrieve data from csv file
async function getData(){
    const data = await d3.csv("US_Stock_Data.csv", d => {
        d.Date = new Date(d.Date);
        for (i in d){
            if (i !== "Date"){
                d[i] = +d[i];
            }
        }
        return d;
    })
}



const stocks = ["S&P_500_Price", "Tesla_Price", "Apple_Price"];
const oil = ["Natural_Gas_Price", "Crude_Oil_Price"];
const commodities = ["Copper_Price", "Platinum_Price", "Silver_Price", "Gold_Price"];

function createCharts(input){
    svg.selectAll("*").remove();

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([50, width - 50]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(input, i => d[i]))])
        .range([height - 40, 40]);

    const yAxis = d3.axisLeft(y);
    const xAxis = d3.axisBottom(x);

    svg.append("a")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);
    
    svg.append("a")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis);
    input.forEach((i, j) => {
        const line = d3.line()
            .x(d => x(d.Date))
            .y(d => y(d[i]));
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color(j))
            .attr("stroke-width", 2)
            .attr("d", line);
        
        svg.append("text")
            .attr("x", width - 120)
            .attr("y", 20 + i * 20)
            .text(i.replace("_Price", ""))
            .attr("fill", color(j));
    });
}
function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}

var url = '/smoothdata/' + window.location.pathname.split("/")[2];

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 150, bottom: 80, left: 180},
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Set the ranges
//var x = d3.time.scale().range([0, width]);
var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);
var y2 = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);          

var yAxis2 = d3.svg.axis().scale(y2)
    .orient("right").ticks(5);

// Adds the svg canvas
var svg = d3.select("#filtered-graph")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Change Title
var title = $('h1').html();
title = title.split('/')[2].split('.')[0];
$('h1').html(title);

// Get the data
d3.csv(url , function(error, data) {

    
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width/2)
        .attr("y", height + 50)
        .text("Time (s)");

    svg.append("text")
        .attr("class", "y1 label")
        .attr("stroke", "steelblue")
        .attr("text-anchor", "end")
        .attr("x", -1*height/2.5)
        .attr("y", -100)
        .attr("transform", "rotate(-90)")
        .text("Counts");

    svg.append("text")
        .attr("class", "y2 label")
        .attr("stroke", "red")
        .attr("text-anchor", "end")
        .attr("x", height/1.5)
        .attr("y", -1*width-125)
        .attr("transform", "rotate(90)")
        .text("Cumulative Counts");

    data.forEach(function(d) {
        d.Time = +d.Time;
        d.Counts = +d.Counts;
        d.Cumulative = +d.Cumulative;
        d.Subtracted = +d.Subtracted;
    });

    // Scale the range of the data
    //x.domain(d3.extent(data, function(d) { return d.date; }));
    x.domain([0, d3.max(data, function(d) { return d.Time; })]);

    y.domain([0, d3.max(data, function(d) { return d.Counts; })]);

    y2.domain([0, d3.max(data, function(d) { return d.Cumulative; })]);
  
    $('#maxcum').html("Total Counts: " + d3.max(data, function(d) { return d.Cumulative; }));
    $('#subtracted').html("Background Subtracted:" + d3.max(data, function(d { return d.Subtracted; })))

    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r",1)
        .attr("cx", function(d) { return x(d.Time) ; })
        .attr("cy", function(d) { return y(d.Counts); })
        .attr("fill","steelblue")
        .attr("stroke","steelblue");

    svg.selectAll("dot")
        .data(data.filter(function (d) { return d.Cumulative > 0; }))
        .enter().append("circle")
        .attr("r",1)
        .attr("cx", function(d) { return x(d.Time) ; })
        .attr("cy", function(d) { return y2(d.Cumulative); })
        .attr("fill","red")
        .attr("stroke","red");


    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .attr("width", 1440)
        .call(xAxis);
        
        

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .attr("stroke", "steelblue")
        .call(yAxis);

    // Add the Y Axis for Cumulative
    svg.append("g")
        .attr("class", "y2 axis")
        .attr("stroke", "red")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis2);

    var brush = d3.svg.brush()
        .x(x)
        .on('brushend', displaySlope);
    brush.extent([]);

    var gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    gBrush.selectAll("rect")
        .attr("height", height);

    function displaySlope() {
        console.log(brush.extent());
        var filtered = data.filter(function (d) { return d.Time >= brush.extent()[0] && d.Time <= brush.extent()[1]; });
        console.log(filtered);
        var xSeries = [];
        var ySeries = [];
        filtered.forEach(function (d) {
            if (d.Cumulative) {
                xSeries.push(d.Time);
                ySeries.push(d.Cumulative);
            };
        });
        if (xSeries.length) {
            var linreg = leastSquares(xSeries, ySeries);
            $('#regression').html('Slope: ' + linreg[0] + '<br />R<sup>2</sup>: ' + linreg[2]);
        }
    }

});

function leastSquares(xSeries, ySeries) {
    var reduceSumFunc = function(prev, cur) { return prev + cur; };
    
    var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
    var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

    var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
        .reduce(reduceSumFunc);
    
    var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
        .reduce(reduceSumFunc);
        
    var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
        .reduce(reduceSumFunc);
        
    var slope = ssXY / ssXX;
    var intercept = yBar - (xBar * slope);
    var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
    
    return [slope, intercept, rSquare];
}

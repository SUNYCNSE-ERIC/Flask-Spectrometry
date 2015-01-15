function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}

function inRange(value,min,max) {
    return isInt(value) && (value >= min) && (value <= max);
}

var url = '/data/' + window.location.pathname.split("/")[2];

// Change Title
var title = $('h1').html();
title = title.split('/')[2].split('.')[0];
$('h1').html(title);

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 150},
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
    .orient("left").ticks(5);

// Define the linear line
var valueline = d3.svg.line()
    .x(function(d) { return x(d.Time); })
    .y(function(d) { return y(d[77]); })
    .interpolate('linear');            

// Adds the svg canvas
var svg = d3.select("#graph")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Add svg for slider
// var slider = d3.select("#slider")
//     .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", 20);

// var brushx = d3.scale.linear()
//     .domain([1, 200])
//     .range([0, width + margin.left + margin.right])
//     .clamp(true);

// // Brush for Slider
// var brush = d3.svg.brush()
//     .x(brushx)
//     .extent([1, 200]);

// var brushg = slider.append("g")
//     .attr("class", "brush")
//     .call(brush);

// Adds the svg canvas
var svg2 = d3.select("#graph-range")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv(url , function(error, data) {
    var min = 201;
    var max = 0;
    for (var prop in data[0]) {
        if (isInt(prop)) {
            min = Math.min(min, prop);
            max = Math.max(max, prop);
        }
    }

    data.forEach(function(d) {
        d.Time = +d.Time;
        d.total = 0;
        for (var prop in d) {
            if (isInt(prop)) {
                d[prop] = +d[prop];
                d.total += d[prop];
                d.filt_total = d.total;
            }
        }
    });

    // Scale the range of the data
    //x.domain(d3.extent(data, function(d) { return d.date; }));
    x.domain([0, d3.max(data, function(d) { return d.Time })]);

    y.domain([0, d3.max(data, function(d) { return d.total })]);

    y2.domain([0, d3.max(data, function(d) { return d.filt_total })]);

    $('button').click(function(e) {
        e.preventDefault();
        min = $('#minmass').val();
        max = $('#maxmass').val();
        svg2.selectAll('circle').remove();
        data.forEach(function(d) {
            d.filt_total = 0;
            for (var prop in d) {
                if (inRange(prop,min,max)) {
                    d.filt_total += d[prop];
                }
            }
        });
        y2.domain([0, d3.max(data, function(d) { return d.filt_total })]);
        svg2.select('.y.axis').call(yAxis2);
        svg2.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("r",1)
            .attr("cx", function(d) { return x(d.Time) ; })
            .attr("cy", function(d) { return y2(d.filt_total); })
            .attr("fill","steelblue")
            .attr("stroke","steelblue");
    });
  
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r",1)
        .attr("cx", function(d) { return x(d.Time) ; })
        .attr("cy", function(d) { return y(d.total); })
        .attr("fill","steelblue")
        .attr("stroke","steelblue");
        
    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .attr("width", 1440)
        .call(xAxis);
        
        

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);


    svg2.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r",1)
        .attr("cx", function(d) { return x(d.Time) ; })
        .attr("cy", function(d) { return y2(d.filt_total); })
        .attr("fill","steelblue")
        .attr("stroke","steelblue");
        
    // Add the X Axis
    svg2.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .attr("width", 1440)
        .call(xAxis);
        
        

    // Add the Y Axis
    svg2.append("g")
        .attr("class", "y axis")
        .call(yAxis2);

});
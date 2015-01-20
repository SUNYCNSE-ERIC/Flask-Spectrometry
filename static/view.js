function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}

var url = '/data/' + window.location.pathname.split("/")[2];

var bkg = [0,0];
var sig = [0,0];

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

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Adds the svg canvas
var svg = d3.select("#graph")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv(url , function(error, data) {

    data.forEach(function(d) {
        d.Time = +d.Time;
        d.total = 0;
        for (var prop in d) {
            if (isInt(prop)) {
                d[prop] = +d[prop];
                d.total += d[prop];
            }
        }
    });

    x.domain([0, d3.max(data, function(d) { return d.Time })]);

    y.domain([0, d3.max(data, function(d) { return d.total })]);
 
    var brush = d3.svg.brush()
        .x(x)
        .extent([0, d3.max(data, function(d) { return d.Time })]);

    $('#signal').click(function(e) {
        e.preventDefault();
        sig = brush.extent();

        svg.selectAll(".sig-rect").remove();

        svg.append('rect')
            .attr('class', 'sig-rect')
            .attr('x', x(sig[0]))
            .attr('width', x(sig[1]-sig[0]))
            .attr('y', y(0)-height)
            .attr('height', height)
            .attr('fill', 'green')
            .attr('fill-opacity', '0.1');
    });

    $('#background').click(function(e) {
        e.preventDefault();
        bkg = brush.extent();

        svg.selectAll(".bkg-rect").remove();

        svg.append('rect')
            .attr('class', 'bkg-rect')
            .attr('x', x(bkg[0]))
            .attr('width', x(bkg[1]-bkg[0]))
            .attr('y', y(0)-height)
            .attr('height', height)
            .attr('fill', 'red')
            .attr('fill-opacity', '0.1');
    });

    $('#save').click(function(e) {
        e.preventDefault();

        if (!(bkg.equals([0,0])) && !(sig.equals([0,0]))) {
            window.location = '/background/' + window.location.pathname.split("/")[2] + '?sig0=' + sig[0] + '&sig1=' + sig[1] + '&bkg0=' + bkg[0] + '&bkg1=' + bkg[1];
        }
    });

    var gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

    gBrush.selectAll("rect")
        .attr("height", height);

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

});
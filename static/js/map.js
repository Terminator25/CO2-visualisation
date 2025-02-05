// main function takes in geoJSON data and draws map
d3.json("/static/data/world_countries_edited.json", function(geographic_data) {
    var year_interval;
    // setting up svg element for map
    "use strict";
    var margin = 75,
        width = 1600 - margin,
        height = 900 - margin;
    // add the main svg element to the body of the page
    var svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin)
        .attr("height", height + margin)
        .attr("transform", "translate(50,20)")
        .append("g")
        .attr("class", "map");
    // create the projection 
    var projection = d3.geo.naturalEarth()
        .scale(290)
        .translate([width / 2, height / 2]);
    // create a d3 path function 
    var path = d3.geo.path().projection(projection);
    // use d3's path function to draw a map from the geoJSON data
    var map = svg.selectAll("path")
        .data(geographic_data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", "gray")
        .style("opacity", 0.8)
        .style("stroke", "black")
        .style("stroke-width", 0.8);
    var countries_loc = [];
    // compute centroids of countries for locating data circles
    for (var i = 0; i < geographic_data.features.length; i += 1) {
        countries_loc[geographic_data.features[i].properties.name] = [path.centroid(geographic_data.features[i])[0], path.centroid(geographic_data.features[i])[1]]
    }
    // some countries' centroids need to be manually adjusted
    countries_loc["United States"] = [365, 215];
    countries_loc["Canada"] = [390, 125];
    countries_loc["France"] = [770, 175];
    countries_loc["Norway"] = [795, 100];
    // create list of years for animation
    var years = [];
    var start_year = 1850,
        end_year = 2014,
        step = 10;
    for (var i = start_year; i < end_year; i += step) {
        years.push(i);
    }
    // Add most recent years
    for (var i = 2011; i < 2015; i += 1) {
        years.push(i);
    }
    // function to draw emissions circles on country 
    // circles are sized by emissions and colored for 1-10 and 11-20
    function plot_emissions(data) {
        // create radius scale (remember to use square root of data)
        var radius = d3.scale.sqrt()
            .domain([-5.4, 10200])
            .range([1, 55]);
        // create color scale for color legend
        var color = d3.scale.ordinal()
            .domain(["1-10", "11-20", "21-30", "31-40", "40+"])
            .range(["red", "yellow", "orange", "blue", "green"]);
        // legend container
        var legend = d3.select(".select")
            .append("svg")
            .attr("class", "legends")
            .attr("width", "680px")
            .attr("height", "180px");
        // color legend
        legend.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate(20,20)");
        var legend_color = d3.legend.color()
            .shape("path", d3.svg.symbol().type("circle").size(100)())
            .shapePadding(15)
            .labelOffset(20)
            .title("Country Emission Rank")
            .scale(color);
        legend.select(".legendOrdinal")
            .call(legend_color);
        // legend for sizing of circles
        legend.append("g")
            .attr("class", "legendSize")
            .attr("transform", "translate(160, 60)");
        var legend_size = d3.legend.size()
            .scale(radius)
            .shape("circle")
            .shapePadding(15)
            .labelOffset(20)
            .labels(["0", "2500", "5000", "7500", "10000"])
            .title("Emission Scale (in Mmt of CO2)")
            .orient("horizontal");
        legend.select(".legendSize")
            .call(legend_size);
        // initial map will display emissions from 2014 (most recent year)
        plot_emissions_by_year(2014);
        // set animate button to cycle through years when pressed
        var animateButton = document.getElementById("animateButton");
        animateButton.onclick = plot_all_decades;
        // function for animating all decades of emissions data
        function plot_all_decades() {
            var year_idx = 0;
            year_interval = setInterval(function() {
                plot_emissions_by_year(years[year_idx]);
                year_idx++;
                if (year_idx >= years.length) {
                    clearInterval(year_interval);
                }
            }, 1000) // 1 second can be adjusted if too slow
        };
        // input box for user to enter a year to visualize
        var yearChange = document.getElementById("yearSelect");
        yearChange.oninput = handleClick;
        // function that handles what happens when user enters a year
        function handleClick() {
            clearInterval(year_interval);
            // get year from box and plot
            plot_emissions_by_year(document.getElementById("yearSelect").value)
            return false;
        }
        // function for plotting emissions in any year in data
        // used for animating decades for user input of a year
        function plot_emissions_by_year(year) {
            if (year.toString().length < 4) {} else {
                if (year < 1850 || year > 2014) {
                    d3.select("h1")
                        .text("Data encompasses years 1850-2014")
                } else {
                    d3.select("h1")
                        .transition()
                        .duration(1000)
                        .text(year + " CO2 Emissions")
                };
                // filter data by year parameter passed to function
                var emissions = data.filter(function(d) {
                    return d.year === +year;
                });
                var sortable = []
                // sorting countries by emissions in year for tooltip and coloring
                for (var i = 0; i < emissions.length; i += 1) {
                    sortable.push([emissions[i].country, emissions[i].emissions]);
                }
                sortable.sort(function(b, a) {
                    return a[1] - b[1];
                })
                for (var i = 0; i < emissions.length; i += 1) {
                    emissions[i].rank = 1 + sortable.map(function(id) {
                        return id[0];
                    }).indexOf(emissions[i].country);
                };
                // add in tooltip
                var div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                var circles = svg.selectAll("circle")
                    .data(emissions)
                // remove extra circles
                circles.exit().remove();
                // add needed circles
                // add in tooltip with emissions, country, rank
                circles.enter()
                    .append("circle")
                    .attr("cx", function(d) {
                        return countries_loc[d.country]['0'];
                    })
                    .attr("cy", function(d) {
                        return countries_loc[d.country]['1'];
                    })
                    .attr("r", function(d) {
                        return radius(d.emissions)
                    })
                    .style("fill", function(d) {
                        return color_by_rank(d.rank)
                        debugger;
                    })
                    .on("mouseover", function(d) {
                        div.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                        div.html("Total CO2: " + Math.round(d.emissions) + " (MMt)" + "<br/>" + "Country: " + d.country + "<br/>" + "Rank: " + d.rank)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    })
                    .on("mouseout", function(d) {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
                // update the radius of existing circles
                circles.transition()
                    .duration(500)
                    .attr("r", function(d) {
                        return radius(d.emissions)
                    })
                    .style("fill", function(d) {
                        return color_by_rank(d.rank)
                    });
                // function to determine color of emission circle
                function color_by_rank(rank) {
                    if (1 <= rank && rank <= 10) {
                        return "red";
                    } else if (11 <= +rank && rank <= 20) {
                        return "yellow";
                    } else if (21 <= +rank && rank <= 30) {
                        return "orange";
                    } else if (31 <= +rank && rank <= 40) {
                        return "green"
                    } else {
                        return "blue";
                    }
                }
            } // end of else statement for plot_emissions_by_year
        } // end of plot_emissions_by_year
    } // end of plot_emissions
    // read in data and call circle drawing function
    d3.csv("/static/data/emissions_stable.csv", function(d) {
        d["country"] = d["country"];
        d["year"] = new Date(d["year"]).getUTCFullYear();
        d["emissions"] = +d["emissions"];
        return d;
    }, plot_emissions);
}); // end of draw function

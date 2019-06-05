HTMLWidgets.widget({

  name: 'pacoplot',

  type: 'output',

  initialize: function(el, width, height) {

    //A little style goes a long way
    d3.select(el)
      .style("font-family", "Arial, Helvetica, sans-serif");

    //SVG
    d3.select(el)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    //Tooltip
    d3.select(el)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("width", "200px")
      .style("height", "28px")
      .style("pointer-events", "none")
      .style("font-weight", "bold");

      return {
        x: null
      };

  },

  resize: function(el, width, height, instance) {

    // Re render at new size
    d3.select("svg")
      .attr("width", width)
      .attr("height", height);

    //Clear out old stuff
    d3.select("svg").selectAll("*").remove();

    //Re render
    this.renderValue(el, instance.x, instance);
  },

  renderValue: function(el, x, instance) {
    //Set instance x
    instance.x = x;

    //load data from x var
    var data = x.data;
    var avData = x.avData;
    var qData = x.qData;
    var qsData = x.qsData;
    var colorScheme = x.colorScheme;
    var labelSizes = x.labelSizes;

    //Tooltip
    var tooltip = d3.select(".tooltip")
      .style("font-size", labelSizes.tooltip + "px" || "14px");

    //Set some boundaries and with/height vars
    var margin = {top: 60, right: 20, bottom: 30, left: 40},
        width = el.offsetWidth - margin.left - margin.right,
        height = el.offsetHeight - margin.top - margin.bottom;

    //Add a plot
    var svg = d3.select("svg")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Column names
    var dimensions = d3.keys(data[0])
      .filter(d => (d != "_row" && d != "clusters"));

    //Settup x
    var xScale = d3.scalePoint()
      .range([0, width])
      .domain(dimensions);

    //Settup y
    var yScale = {};
    for (var i in dimensions) {
      dp = dimensions[i];
      yScale[dp] = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[dp]))
        .range([height, 0]);
    }

    //Settup color scheme
    var cValue = d => d.clusters,
      color = (typeof(d3[colorScheme]) === "undefined") ?
        d3.scaleOrdinal().range(colorScheme) :
        d3.scaleOrdinal(d3[colorScheme]);

    //Lines
    function path(d) {
      return d3.line()(dimensions.map(p => [xScale(p), yScale[p](d[p])]));
    }

    //Add mean lines this must be first in case any cluster has only one
    //observation. It allows the hover to still work.
    svg.selectAll(".path")
      .data(avData)
      .enter()
      .append("path")
      .attr("id", "averages")
      .attr("d",  path)
      .style("fill", "none")
      .style("stroke", d => color(cValue(d)))
      .style("opacity", 0)
      .style("stroke-width", 2)
      .style("cursor", "pointer");

    //Add error bars (needed data in long format for this)
    svg.selectAll(".bar")
  	  .data(qsData)
  	  .enter().append("rect")
  	  .attr("id", "quarBars")
  	  .attr("x", d => xScale(d.dimensions) - 5)
      .attr("y", d => yScale[d.dimensions](d.q3))
  	  .attr("width", 10)
  	  .attr("height", d => (height - yScale[d.dimensions](d.q3)) - (height - yScale[d.dimensions](d.q1)))
  	  .style("fill", d => color(cValue(d)))
  	  .style("opacity", 0);

    svg.selectAll(".dot")
      .data(qData)
      .enter()
      .append("ellipse")
      .attr("id", "quartiles")
      .attr("rx", 10)
      .attr("ry", 0.5)
      .attr("cx", d => xScale(d.dimensions))
      .attr("cy", d => yScale[d.dimensions](d.quartile))
      .style("fill", d => color(cValue(d)))
      .style("opacity", 0);

    //Add lines
    svg.selectAll(".path")
      .data(data)
      .enter()
      .append("path")
      .attr("id", "pathsie")
      .attr("d",  path)
      .style("fill", "none")
      .style("stroke", d => color(cValue(d)))
      .style("opacity", 0.5)
      .style("cursor", "pointer")
      .on("mousemove", function(d) {
        tooltip.html(d._row)
          .style("left", (d3.mouse(this)[0] + 10) + "px")
          .style("top", d3.mouse(this)[1] + "px")
          .style("opacity", 1);
      })
      .on("mouseover", function(d) {
        d3.select(this).style("stroke-width", 5);
      })
      .on("mouseout", function(d) {
        d3.select(this).style("stroke-width", 1);
        tooltip.style("opacity", 0);
      })
      .on("click", function(d) {
        var isClicked = d3.select(this).style("opacity") == 1;
        var currColor = d3.select(this).style("stroke");

        //First click
        if (!isClicked) {
          //Set the selected line opacity to 1
          d3.selectAll("#pathsie").filter(function() {
            return (d3.select(this).style("stroke") === currColor);
          })
            .style("opacity", 1);

          //Set all other line opacities to 0.1
          d3.selectAll("#pathsie").filter(function() {
            return (d3.select(this).style("stroke") !== currColor &&
                    d3.select(this).style("opacity") != 1);
          })
            .style("opacity", 0.1);

        //Second click
        } else {
          //Set the selected line opacity to 0.1
          d3.selectAll("#pathsie").filter(function() {
            return (d3.select(this).style("stroke") === currColor);
          })
            .style("opacity", 0.1);

          var allUnselected = d3.selectAll("#pathsie").filter(function() {
            return (d3.select(this).style("opacity") == 1);
          })._groups[0].length === 0;

          //If the selected line was the last to be set to opacity 1,
          //set all opacities to default 0.5
          if (allUnselected) {
            d3.selectAll("#pathsie").style("opacity", 0.5);
          }
        }
      });

    //Checkboxes
    var checks = svg.append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => { return "translate(0," + i * 20 + ")"; });


    checks.append("rect")
      .attr("x", width - 18)
      .attr("y", -50)
      .attr("width", 18)
      .attr("height", 18)
      .attr("id", "checkbox")
      .style("stroke", "black")
 			.style("fill", "white")
 			.style("stroke-width", 1)
      .style("cursor", "pointer")
      .on("click", function() {
        var avs = svg.selectAll("#averages");
        var quar = svg.selectAll("#quartiles");
        var quarBars = svg.selectAll("#quarBars");
        var norm = svg.selectAll("#pathsie");
        if (avs.style("opacity") != 0.5) {
          avs.style("opacity", 0.5);
          quar.style("opacity", 1);
          quarBars.style("opacity", 0.2);
          norm.style("display", "none");
          svg.select("#checkbox").style("fill", "black");
        } else {
          avs.style("opacity", 0);
          quar.style("opacity", 0);
          quarBars.style("opacity", 0);
          norm.style("display", "inline-block");
          svg.select("#checkbox").style("fill", "white");
        }
      });

    checks.append("text")
      .attr("x", width - 24)
      .attr("y", -41)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .text("Toggle Averages");

    //Draw axes
    svg.selectAll(".axis")
      .data(dimensions)
      .enter()
      .append("g")
      .style("font-size", labelSizes.yticks + "px" || "10px")
      .attr("transform", d => "translate(" + xScale(d) + ")")
      .each(function(d) { d3.select(this).call(d3.axisLeft().scale(yScale[d])); })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d)
      .style("fill", "black")
      .style("font-size", labelSizes.yaxis + "px" || "10px");

  }
});

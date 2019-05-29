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
      .style("font-weight", "bold")
      .style("font-size", "14px");

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
    var colorScheme = x.colorScheme;

    //Tooltip
    var tooltip = d3.select(".tooltip");

    //Set some boundaries and with/height vars
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
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

    //Data points
    function path(d) {
      return d3.line()(dimensions.map(p => [xScale(p), yScale[p](d[p])]));
    }

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

    //Draw axes
    svg.selectAll(".axis")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("transform", d => "translate(" + xScale(d) + ")")
      .each(function(d) { d3.select(this).call(d3.axisLeft().scale(yScale[d])); })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d)
      .style("fill", "black");

  }
});

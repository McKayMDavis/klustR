HTMLWidgets.widget({

  name: 'parallelcoords',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        // TODO: code to render the widget, e.g.
        data = x.data;

        // Set some boundaries and with/height vars
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = el.offsetWidth - margin.left - margin.right,
            height = el.offsetHeight - margin.top - margin.bottom;

        // Set x values, scale, map and axis
        var xScale = d3.scaleOrdinal().rangePoints([0, width], 1),
            y = {},
            foreground;

        // Set y values, scale, map and axis
        var line = d3.line(),
            yAxes = d3.axisLeft();

        // Set fill color scheme
        var cValue = function(d) { return d.clusters;},
            color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create SVG (graphical area)
        var svg = d3.select(el)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Set scale for each dimmension
        xScale.domain(dimensions = d3.keys(data[0]).filter(function(d) {
          return d != "_row" && (y[d] = d3.scaleLinear()
              .domain(d3.extent(data, function(p) { return +p[d]; }))
              .range([height, 0]));
        }));

        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + xScale(d) + ")"; });

        // Axes
        g.append("g")
           .attr("class", "axis")
           .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
           .append("text")
           .style("text-anchor", "middle")
           .attr("y", -9)
           .text(function(d) { return d; });

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});

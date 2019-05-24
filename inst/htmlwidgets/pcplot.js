HTMLWidgets.widget({

  name: 'pcplot',

  type: 'output',

  initialize: function(el, width, height) {

    //A little style goes a long way
    d3.select(el)
      .style("font-family", "Arial, Helvetica, sans-serif");

    //Initialize an svg
    var svg = d3.select(el)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    //Tooltip
    var tooltip = d3.select(el)
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("width", "200px")
      .style("height", "28px")
      .style("pointer-events", "none")
      .style("font-weight", "bold")
      .style("font-size", "14px");

    //Return a bunch of values accessible in the instance object
    return {
      x: null,
      pc: null,
      currPlot: null,
////////////////////////////////////////////////////////////////////////////////
// Function to draw a dimension reduced dot plot of clusters.
////////////////////////////////////////////////////////////////////////////////
      pcaPlot: function(instance) {

        //Set current plot type
        instance.currPlot = "pca";

        //Pull out some stuff from the instance
        var x = instance.x,
          margin = instance.margin,
          width = instance.width,
          height = instance.height;

        //User opts
        colorScheme = x.colorScheme;

        //Calculations
        pcDat = x.PC;
        pvDat = x.PVE;
        idxs = x.idxs;
        idx1 = idxs[0] - 1; //Convert to JS indx instead of R indx
        idx2 = idxs[1] - 1;
        pve1 = pvDat[idx1].PVEs * 100;
        pve2 = pvDat[idx2].PVEs * 100;

        //Settup x
        var xValue = d => Object.values(d)[idx1],
          xScale = d3.scaleLinear().range([0, width]),
          xMap = d => xScale(xValue(d)),
          xAxis = d3.axisBottom(xScale);

        //Settup y
        var yValue = d => Object.values(d)[idx2],
          yScale = d3.scaleLinear().range([height, 0]),
          yMap = d => yScale(yValue(d)),
          yAxis = d3.axisLeft(yScale);

        //Settup color scheme
        var cValue = d => d.clusters,
          color = (typeof(d3[colorScheme]) === "undefined") ?
            d3.scaleOrdinal().range(colorScheme) :
            d3.scaleOrdinal(d3[colorScheme]);

        //Append plot
        var svg = d3.select("svg")
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Set domain for the data with a buffer so points don't overlap the axes
        xScale.domain([d3.min(pcDat, xValue)-1, d3.max(pcDat, xValue)+1]);
        yScale.domain([d3.min(pcDat, yValue)-1, d3.max(pcDat, yValue)+1]);

        //X-axis
        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .append("text")
          .attr("fill", "black")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .style("cursor", "pointer")
          .on("mouseover", function() {
            d3.select(this).transition()
              .style("font-weight", "bold");
          })
          .on("mouseout", function() {
            d3.select(this).transition()
              .style("font-weight", "normal");
          })
          .on("click", function() {
            d3.select("svg").selectAll("*")
              .remove();
              instance.pc = "PC1";
              instance.barChart(instance);
        	})
          .text("PC1 - " + Number.parseFloat(pve1).toFixed(2) + "%");

        //Y-axis
        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          .attr("fill", "black")
          .attr("class", "label")
          .attr("id", "pc2")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .style("cursor", "pointer")
          .on("mouseover", function() {
            d3.select(this).transition()
              .style("font-weight", "bold");
          })
          .on("mouseout", function() {
            d3.select(this).transition()
              .style("font-weight", "normal");
          })
          .on("click", function() {
            d3.select("svg").selectAll("*")
              .remove();
              instance.pc = "PC2";
              instance.barChart(instance);
        	})
          .text("PC2 - " + Number.parseFloat(pve2).toFixed(2) + "%");

        //Draw points and add dynamic affects for mouseover points
        svg.selectAll(".dot")
          .data(pcDat)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("id", d => "dot" + d.clusters)
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", d => color(cValue(d)))
          .on("mouseover", function(d) {
            var currentDot = this;
            svg.selectAll(".dot")
              .filter(function() { return (this !== currentDot); })
              .transition()
              .duration(200)
              .style("opacity", 0.1);
            tooltip.style("opacity", 1)
              .html(d._row)
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            svg.selectAll(".dot").transition()
              .delay(100)
              .duration(500)
              .style("opacity", 1);
            tooltip.style("opacity", 0);
          });

        //Draw legend area
        var legend = svg.selectAll(".legend")
          .data(color.domain())
          .enter()
          .append("g")
          .attr("class", "legend")
          .attr("transform", (d, i) => { return "translate(0," + i * 20 + ")"; })
          .on("click", function(d) {
            var curr = '#dot' + d,
              oth = '.dot:not(' + curr + ')',
              currOpacity = svg.selectAll(curr).style("opacity"),
              othersOpacity = svg.selectAll(oth).style("opacity");

            if (othersOpacity < 1 && currOpacity < 1) {
              svg.selectAll(curr).style("opacity", 1);
              svg.selectAll(oth).transition()
                .style("opacity", 0.1);

            } else if (othersOpacity < 1) {
              svg.selectAll(oth).transition()
                .style("opacity", 1);
            } else {
              svg.selectAll(curr).style("opacity", 1);
              svg.selectAll(oth).transition()
                .style("opacity", 0.1);
            }
          });

        //Draw legend colors
        legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color)
          .style("cursor", "pointer");

        //Draw legend labels
        legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(d => d);
    },
////////////////////////////////////////////////////////////////////////////////
// Function to draw a bar chart of PC contributions
////////////////////////////////////////////////////////////////////////////////
      barChart: function (instance) {

        //Set current plot type
        instance.currPlot = "bar";

        var x = instance.x,
          component = instance.pc,
          margin = instance.margin,
          width = instance.width,
          height = instance.height;

        //User opts
        barColor = x.barColor;

        //Calculations
        cont = x.cont;
        thresh = x.thresh;

        //Settup x
        var xValue = d => d._row,
          xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1),
          xMap = d => xScale(xValue(d)),
          xAxis = d3.axisBottom(xScale);

        //Settup y
        var yValue = d => d[component],
          yScale = d3.scaleLinear().rangeRound([height, 0]),
          yMap = d => yScale(yValue(d)),
          yAxis = d3.axisLeft(yScale);

        //Append plot
        var svg = d3.select("svg")
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //Domains
      	xScale.domain(cont.map(xValue));
      	yScale.domain([0, d3.max(cont, yValue)]);

        //X-axis
      	svg.append("g")
      	  .attr("transform", "translate(0," + height + ")")
      	  .call(xAxis);

        //Y-axis
      	svg.append("g")
      	  .call(yAxis);

        //Add bars
      	svg.selectAll(".bar")
      	  .data(cont)
      	  .enter().append("rect")
      	  .style("fill", barColor)
      	  .attr("class", "bar")
      	  .attr("x", d => xMap(d))
          .attr("y", d => yMap(d))
      	  .attr("width", xScale.bandwidth())
      	  .attr("height", d => height - yMap(d))
          .on("mousemove", function(d) {
            tooltip.html(Number.parseFloat(yValue(d)).toFixed(2) + "%")
              .style("left", (d3.mouse(this)[0] + 10) + "px")
              .style("top", d3.mouse(this)[1] + "px")
              .style("opacity", 1);
          })
          .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
          });

        //Add cuttoff line
      	svg.append("line")
      	  .attr("x1", 0)
      	  .attr("x2", width)
      	  .attr("y1", yScale(thresh[0]))
      	  .attr("y2", yScale(thresh[0]))
      	  .style("stroke", "darkred")
      	  .style("stroke-width", 1.5)
      	  .style("stroke-dasharray", ("3, 3"));

        //Plot title
      	svg.append("text")
          .attr("x", (100)) // I'm not sure on this
          .attr("y", 0 - (margin.top / 3))
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Contribution (%) of Variables to " + component);

        //Return button
        svg.append("text")
          .attr("x", (width - width / 10)) // Or this
          .attr("y", 0 - (margin.top / 3))
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("text-decoration", "underline")
          .style("cursor", "pointer")
          .on("click", function() {
            d3.select("svg").selectAll("*")
              .remove();
              instance.pcaPlot(instance);
          	})
          .text("Return");
      }
    };
  },

  resize: function(el, width, height, instance) {

    // TODO: code to re-render the widget with a new size
    d3.select("svg")
      .attr("width", width)
      .attr("height", height);

    //Re render
    if (instance.currPlot == "pca") {
      this.renderValue(el, instance.x, instance);
    } else if (instance.currPlot == "bar") {
      this.renderValue(el, instance.x, instance, fun = instance.barChart);
    }
  },

  renderValue: function(el, x, instance, fun = instance.pcaPlot) {

    //Set some boundaries and width/height vars
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = el.offsetWidth - margin.left - margin.right,
      height = el.offsetHeight - margin.top - margin.bottom;

    //Save stuff to the instance
    instance.x = x;
    instance.margin = margin;
    instance.width = width;
    instance.height = height;

    //Clear out old stuff
    d3.select("svg").selectAll("*").remove();

    //Render with whatever function is passed to it...could be anything! Ice cream maybe, or a clown riding a lawn mower...you know...or just a bar chart or dot plot...
    fun(instance);
  }
});

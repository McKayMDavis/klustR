HTMLWidgets.widget({

  name: 'pcplot',

  type: 'output',

  initialize: function(el, width, height) {

    //Initialize an svg
    d3.select(el)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    //Return a bunch of values accessible in the instance object
    return {
      x: null,
      pc: null,
      currPlot: null,



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
        idx1 = idxs[0] - 1; // Subtract one to convert to JS indx instead of R indx
        idx2 = idxs[1] - 1;
        pve1 = pvDat[idx1].PVEs * 100;
        pve2 = pvDat[idx2].PVEs * 100;

        // Set x values, scale, map and axis
        var xValue = function(d) { return Object.values(d)[idx1]; },
          xScale = d3.scaleLinear().range([0, width]),
          xMap = function(d) { return xScale(xValue(d)); },
          xAxis = d3.axisBottom(xScale);

        // Set y values, scale, map and axis
        var yValue = function(d) { return Object.values(d)[idx2]; },
          yScale = d3.scaleLinear().range([height, 0]),
          yMap = function(d) { return yScale(yValue(d)); },
          yAxis = d3.axisLeft(yScale);

        // Set fill color scheme
        var cValue = function(d) { return d.clusters;},
          color = (typeof(d3[colorScheme]) === "undefined") ?
            d3.scaleOrdinal().range(colorScheme) :
            d3.scaleOrdinal(d3[colorScheme]);

        // Create SVG (graphical area)
        var svg = d3.select("svg")
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add tooltip
        var tooltip = d3.select(el)
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("width", "200px")
          .style("height", "28px")
          .style("pointer-events", "none")
          .style("font-weight", "bold");

        // Set domain for the data with a buffer so points don't overlap the axes
        xScale.domain([d3.min(pcDat, xValue)-1, d3.max(pcDat, xValue)+1]);
        yScale.domain([d3.min(pcDat, yValue)-1, d3.max(pcDat, yValue)+1]);

        // X-axis
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
          .on("mouseover", function() {
            d3.select(this).transition()
              .style("font-weight", "bold");
          })
          .on("mouseout", function() {
            d3.select(this).transition()
              .style("font-weight", "normal");
          })
          .on("click", function() {
            d3.select("svg").selectAll("*").transition()
              .duration(500)
              .style("opacity", 0)
              .remove();
              instance.pc = "PC1";
              instance.barChart(instance);
        	})
          .text("PC1 - " + Number.parseFloat(pve1).toPrecision(4) + "%");

        // Y-axis
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
          .on("mouseover", function() {
            d3.select(this).transition()
              .style("font-weight", "bold");
          })
          .on("mouseout", function() {
            d3.select(this).transition()
              .style("font-weight", "normal");
          })
          .on("click", function() {
            d3.select("svg").selectAll("*").transition()
              .duration(500)
              .style("opacity", 0)
              .remove();
              instance.pc = "PC2";
              instance.barChart(instance);
        	})
          .text("PC2 - " + Number.parseFloat(pve2).toPrecision(4) + "%");

        // Draw points and add dynamic affects for mouseover points
        svg.selectAll(".dot")
          .data(pcDat)
          .enter()
          .append("circle")
          .attr("class", "dot")
          .attr("id", function(d) { return "dot" + d.clusters; })
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", function(d) { return color(cValue(d)); })
          .on("mouseover", function(d) {
            var currentDot = this;
            svg.selectAll(".dot").filter(function(d,i) { return (this !== currentDot); })
              .transition()
              .duration(200)
              .style("opacity", 0.2);
            tooltip.transition()
              .duration(200)
              .style("opacity", 1);
            tooltip.html(d._row + "<br/> (" + xValue(d) + ", " + yValue(d) + ")")
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            svg.selectAll(".dot").transition()
              .delay(100)
              .duration(500)
              .style("opacity", 1);
            tooltip.transition()
              .delay(100)
              .duration(200)
              .style("opacity", 0);
          });

        // Draw legend area
        var legend = svg.selectAll(".legend")
          .data(color.domain())
          .enter()
          .append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
          .on("click", function(d) {
            var currentGroupOpacity = svg.selectAll('#dot' + d).style("opacity"),
                allOthersOpacity = svg.selectAll('.dot:not(#dot' + d + ')').style("opacity");
            if (allOthersOpacity < 1 && currentGroupOpacity < 1) {
              svg.selectAll('#dot' + d).style("opacity", 1);
              svg.selectAll('.dot:not(#dot' + d + ')').transition()
                .style("opacity", 0.1);

            } else if (allOthersOpacity < 1) {
              svg.selectAll('.dot:not(#dot' + d + ')').transition()
                .style("opacity", 1);
            } else {
              svg.selectAll('#dot' + d).style("opacity", 1);
              svg.selectAll('.dot:not(#dot' + d + ')').transition()
                .style("opacity", 0.1);
            }
          });

        // Draw legend colors
        legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

        // Draw legend labels
        legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d; });
    },



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

      var xScale = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.1);

      var yScale = d3.scaleLinear()
        .rangeRound([height, 0]);


      var svg = d3.select("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    	xScale.domain(cont.map(function (d) { return d._row; }));
    	yScale.domain([0, d3.max(cont, function (d) { return d[component]; })]);

    	svg.append("g")
    	  .attr("transform", "translate(0," + height + ")")
    	  .call(d3.axisBottom(xScale));

      //This text has potential to be covered by bars......
    	svg.append("g")
    	  .call(d3.axisLeft(yScale))
    	  .append("text")
    	  .attr("fill", "#000")
    	  .attr("transform", "rotate(-90)")
    	  .attr("y", 6)
    	  .attr("dy", "0.71em");

    	svg.selectAll(".bar")
    	  .data(cont)
    	  .enter().append("rect")
    	  .style("fill", barColor)
    	  .attr("class", "bar")
    	  .attr("x", function (d) { return xScale(d._row); })
        .attr("y", function (d) { return yScale(d[component]); })
    	  .attr("width", xScale.bandwidth())
    	  .attr("height", function (d) { return height - yScale(d[component]); });

    	svg.append("line")
    	  .attr("x1", 0)
    	  .attr("x2", width)
    	  .attr("y1", yScale(thresh[0]))
    	  .attr("y2", yScale(thresh[0]))
    	  .style("stroke", "darkred")
    	  .style("stroke-width", 1.5)
    	  .style("stroke-dasharray", ("3, 3"));

    	svg.append("text")
        .attr("x", (100)) // I'm not sure on this
        .attr("y", 0 - (margin.top / 3))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Contribution (%) of Variables to " + component);

      svg.append("text")
        .attr("x", (width - width / 10)) // Or this
        .attr("y", 0 - (margin.top / 3))
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("text-decoration", "underline")
        .on("click", function() {
          d3.select("svg").selectAll("*").transition()
            .duration(500)
            .style("opacity", 0)
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

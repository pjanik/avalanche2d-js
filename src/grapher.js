(function(){grapher = {version: "0.0.1"}; // semver
grapher.data = function(array) {
  var i = 0,
      n = array.length,
      points = [];
  for (i = 0; i < n;  i = i + 2) {
    points.push( { x: array[i], y: array[i+1] } )
  };
  return points;
};
grapher.indexedData = function(array, initial_index) {
  var i = 0,
      start_index = initial_index || 0,
      n = array.length,
      points = [];
  for (i = 0; i < n;  i++) {
    points.push( { x: i+start_index, y: array[i] } )
  };
  return points;
};
// commentssss
grapher.colors = function(color) {
  var colors = {
    bright_red:       '#ff0000',
    dark_red:         '#990000',
    bright_blue:      '#4444ff',
    dark_blue:        '#110077',
    bright_green:     '#00dd00',
    dark_green:       '#118800',
    bright_purple:    '#cc00cc',
    dark_purple:      '#770099',
    bright_orange:    '#ee6600',
    dark_orange:      '#aa4400',
    bright_turquoise: '#00ccbb',
    dark_turquoise:   '#008877',
  };
  return colors[color]
};

grapher.sampleGraph = function(array) {
  
  var size = [440, 350],
      padding = [20, 30, 20, 40], // top right bottom left
      mw = size[0] - padding[1] - padding[3],
      mh = size[1] - padding[0] - padding[2],
      tx = function(d) { return "translate(" + x(d) + ",0)"; },
      ty = function(d) { return "translate(0," + y(d) + ")"; },
      stroke = function(d) { return d ? "#ccc" : "#666"; },
      points = grapher.indexedData(array, 0)
      // x = d3.time.scale()
      //     .domain([0,60])
      //     .range([0,mw]),
      // x-scale
      x = d3.scale.linear()
          .domain([0,60])
          .range([0, mw]),
      // drag x-axis logic
      downscalex = x.copy(),
      downx = Math.NaN,
      // y-scale (inverted domain)
      y = d3.scale.linear()
          .domain([40, 10])
          .range([0, mh]),
      line = d3.svg.line()
          .x(function(d, i) { return x(points[i].x); })
          .y(function(d, i) { return y(points[i].y); }),
      // drag x-axis logic
      downscaley = y.copy(),
      downy = Math.NaN,
      dragged = null,
      selected = points[0];

  var vis = d3.select("#chart").append("svg:svg")
      .attr("width", size[0] + padding[3] + padding[1])
      .attr("height", size[1] + padding[0] + padding[2])
      // .style("background-fill", "#FFEEB6")
      .append("svg:g")
        .attr("transform", "translate(" + padding[3] + "," + padding[0] + ")");

  var graph = vis.append("svg:rect")
      .attr("width", size[0])
      .attr("height", size[1])
      // .attr("stroke", "none")
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().on("zoom", redraw))
      .on("mousedown", function() {
        if (d3.event.altKey) {
            points.push(selected = dragged = d3.svg.mouse(vis.node()));
            update();
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
      });

  vis.append("svg:path")
      .attr("class", "line")
      .attr("d", line(points));

  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup)
      .on("keydown", keydown);

  // Add interpolator dropdown
  d3.select("#interpolate")
      .on("change", function() {
        line.interpolate(this.value);
        update();
      })
    .selectAll("option")
      .data([
        "linear",
        "step-before",
        "step-after",
        "basis",
        "basis-open",
        "basis-closed",
        "cardinal",
        "cardinal-open",
        "cardinal-closed",
        "monotone"
      ])
    .enter().append("option")
      .attr("value", String)
      .text(String);

  function update() {
    var lines = vis.select("path").attr("d", line(points));
        
    var circle = vis.selectAll("circle")
        .data(points, function(d) { return d; });

    circle.enter().append("svg:circle")
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d.x); })
        .attr("cy",    function(d) { return y(d.y); })
        .attr("r", 6.0)
        .on("mousedown", function(d) {
          selected = dragged = d;
          update();
        });
      // .transition()
      //   .duration(100)
      //   .ease("elastic")
      //   .attr("r", 6.0);

    circle
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d.x); })
        .attr("cy",    function(d) { return y(d.y); });

    circle.exit().remove();

    if (d3.event && d3.event.keyCode) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }

  function mousemove() {
    if (!dragged) return;
    var m = d3.svg.mouse(vis.node());
    dragged.x = x.invert(Math.max(0, Math.min(size[0], m[0])));
    dragged.y = y.invert(Math.max(0, Math.min(size[1], m[1])));
    update();
  }

  function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;
  }

  function keydown() {
    if (!selected) return;
    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: { // delete
        var i = points.indexOf(selected);
        points.splice(i, 1);
        selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
        update();
        break;
      }
    }
  }

  redraw();

  function redraw() {
    if (d3.event && d3.event.transform && isNaN(downx) && isNaN(downy)) {
        d3.event.transform(x, y);
    };

    var fx = x.tickFormat(10),
        fy = y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = vis.selectAll("g.x")
        .data(x.ticks(10), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("svg:g", "a")
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("svg:line")
        .attr("stroke", stroke)
        .attr("y1", 0)
        .attr("y2", size[1]);

     gxe.append("svg:text")
         .attr("y", size[1])
         .attr("dy", "1em")
         .attr("text-anchor", "middle")
         .text(fx)
         .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
         .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
         .on("mousedown", function(d) {
              var p = d3.svg.mouse(vis[0][0]);
              downx = x.invert(p[0]);
              downscalex = null;
              downscalex = x.copy();
              // d3.behavior.zoom().off("zoom", redraw);
         });
      

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = vis.selectAll("g.y")
        .data(y.ticks(10), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("svg:g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");

    gye.append("svg:line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", size[0]);

    gye.append("svg:text")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown", function(d) {
             var p = d3.svg.mouse(vis[0][0]);
             downy = y.invert(p[1]);
             downscaley = y.copy();
             // d3.behavior.zoom().off("zoom", redraw);
        });
      

    gy.exit().remove();
    update();

  }

  // attach the mousemove and mouseup to the body
  // in case one wonders off the axis line

  d3.select('body')
    .on("mousemove", function(d) {
      var p = d3.svg.mouse(vis[0][0]);
      if (!isNaN(downx)) {
        var rupx = downscalex.invert(p[0]),
          xaxis1 = downscalex.domain()[0],
          xaxis2 = downscalex.domain()[1],
          xextent = xaxis2 - xaxis1;
        if (rupx != 0) {
            var changex, new_domain;
            changex = downx / rupx;
            new_domain = [xaxis1, xaxis1 + (xextent * changex)];
            x.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      };
      if (!isNaN(downy)) {
          rupy = downscaley.invert(p[1]),
          yaxis1 = downscaley.domain()[1],
          yaxis2 = downscaley.domain()[0],
          yextent = yaxis2 - yaxis1;
        if (rupy != 0) {
            var changey, new_domain;
            changey = downy / rupy;
            new_domain = [yaxis1 + (yextent * changey), yaxis1];
            y.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    })
    .on("mouseup", function(d) {
        if (!isNaN(downx)) {
            redraw();
            downx = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        if (!isNaN(downy)) {
            redraw();
            downy = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
    });
};
grapher.citiesSampleGraph = function(city) {
  
  var size = [890, 450],
      padding = [20, 30, 20, 40], // top right bottom left
      mw = size[0] - padding[1] - padding[3],
      mh = size[1] - padding[0] - padding[2],
      tx = function(d) { return "translate(" + x(d) + ",0)"; },
      ty = function(d) { return "translate(0," + y(d) + ")"; },
      stroke = function(d) { return d ? "#ccc" : "#666"; },
      points = grapher.indexedData(city.average_temperatures, 1)
      // x = d3.time.scale()
      //     .domain([0,60])
      //     .range([0,mw]),
      // x-scale
      x = d3.scale.linear()
          .domain([1,12])
          .range([0, mw]),
      // drag x-axis logic
      downscalex = x.copy(),
      downx = Math.NaN,
      // y-scale (inverted domain)
      y = d3.scale.linear()
          .domain([30, -30])
          .range([0, mh]),
      line = d3.svg.line()
          .x(function(d, i) { return x(points[i].x); })
          .y(function(d, i) { return y(points[i].y); }),
      // drag x-axis logic
      downscaley = y.copy(),
      downy = Math.NaN,
      dragged = null,
      selected = points[0];

  var vis = d3.select("#chart").append("svg:svg")
      .attr("width", size[0] + padding[3] + padding[1])
      .attr("height", size[1] + padding[0] + padding[2])
      // .style("background-fill", "#FFEEB6")
      .append("svg:g")
        .attr("transform", "translate(" + padding[3] + "," + padding[0] + ")");

  var graph = vis.append("svg:rect")
      .attr("width", size[0])
      .attr("height", size[1])
      // .attr("stroke", "none")
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().on("zoom", redraw))
      .on("mousedown", function() {
        if (d3.event.altKey) {
            points.push(selected = dragged = d3.svg.mouse(vis.node()));
            update();
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
      });

  vis.append("svg:path")
      .attr("class", "line")
      .attr("d", line(points));

  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup)
      .on("keydown", keydown);

  // Add interpolator dropdown
  d3.select("#interpolate")
      .on("change", function() {
        line.interpolate(this.value);
        update();
      })
    .selectAll("option")
      .data([
        "linear",
        "step-before",
        "step-after",
        "basis",
        "basis-open",
        "basis-closed",
        "cardinal",
        "cardinal-open",
        "cardinal-closed",
        "monotone"
      ])
    .enter().append("option")
      .attr("value", String)
      .text(String);

  function update() {
    var lines = vis.select("path").attr("d", line(points));
        
    var circle = vis.selectAll("circle")
        .data(points, function(d) { return d; });

    circle.enter().append("svg:circle")
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d.x); })
        .attr("cy",    function(d) { return y(d.y); })
        .attr("r", 6.0)
        .on("mousedown", function(d) {
          selected = dragged = d;
          update();
        });
      // .transition()
      //   .duration(100)
      //   .ease("elastic")
      //   .attr("r", 6.0);

    circle
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d.x); })
        .attr("cy",    function(d) { return y(d.y); });

    circle.exit().remove();

    if (d3.event && d3.event.keyCode) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }

  function mousemove() {
    if (!dragged) return;
    var m = d3.svg.mouse(vis.node());
    dragged.x = x.invert(Math.max(0, Math.min(size[0], m[0])));
    dragged.y = y.invert(Math.max(0, Math.min(size[1], m[1])));
    update();
  }

  function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;
  }

  function keydown() {
    if (!selected) return;
    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: { // delete
        var i = points.indexOf(selected);
        points.splice(i, 1);
        selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
        update();
        break;
      }
    }
  }

  redraw();

  function redraw() {
    if (d3.event && d3.event.transform && isNaN(downx) && isNaN(downy)) {
        d3.event.transform(x, y);
    };

    var fx = x.tickFormat(10),
        fy = y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = vis.selectAll("g.x")
        .data(x.ticks(10), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("svg:g", "a")
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("svg:line")
        .attr("stroke", stroke)
        .attr("y1", 0)
        .attr("y2", size[1]);

     gxe.append("svg:text")
         .attr("y", size[1])
         .attr("dy", "1em")
         .attr("text-anchor", "middle")
         .text(fx)
         .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
         .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
         .on("mousedown", function(d) {
              var p = d3.svg.mouse(vis[0][0]);
              downx = x.invert(p[0]);
              downscalex = null;
              downscalex = x.copy();
              // d3.behavior.zoom().off("zoom", redraw);
         });
      

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = vis.selectAll("g.y")
        .data(y.ticks(10), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("svg:g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");

    gye.append("svg:line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", size[0]);

    gye.append("svg:text")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown", function(d) {
             var p = d3.svg.mouse(vis[0][0]);
             downy = y.invert(p[1]);
             downscaley = y.copy();
             // d3.behavior.zoom().off("zoom", redraw);
        });
      

    gy.exit().remove();
    update();

  }

  // attach the mousemove and mouseup to the body
  // in case one wonders off the axis line

  d3.select('body')
    .on("mousemove", function(d) {
      var p = d3.svg.mouse(vis[0][0]);
      if (!isNaN(downx)) {
        var rupx = downscalex.invert(p[0]),
          xaxis1 = downscalex.domain()[0],
          xaxis2 = downscalex.domain()[1],
          xextent = xaxis2 - xaxis1;
        if (rupx != 0) {
            var changex, new_domain;
            changex = downx / rupx;
            new_domain = [xaxis1, xaxis1 + (xextent * changex)];
            x.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      };
      if (!isNaN(downy)) {
          rupy = downscaley.invert(p[1]),
          yaxis1 = downscaley.domain()[1],
          yaxis2 = downscaley.domain()[0],
          yextent = yaxis2 - yaxis1;
        if (rupy != 0) {
            var changey, new_domain;
            changey = downy / rupy;
            new_domain = [yaxis1 + (yextent * changey), yaxis1];
            y.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    })
    .on("mouseup", function(d) {
        if (!isNaN(downx)) {
            redraw();
            downx = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        if (!isNaN(downy)) {
            redraw();
            downy = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
    });
};
grapher.surfaceTemperatureSampleGraph = function(global_temperatures) {
  var size = [890, 450],
      padding = [20, 30, 20, 40], // top right bottom left
      mw = size[0] - padding[1] - padding[3],
      mh = size[1] - padding[0] - padding[2],
      tx = function(d) { return "translate(" + x(d) + ",0)"; },
      ty = function(d) { return "translate(0," + y(d) + ")"; },
      stroke = function(d) { return d ? "#ccc" : "#666"; },
      surface_temperature = global_temperatures.temperature_anomolies.map(function(e) { return [e[0], e[1] + global_temperatures.global_surface_temperature_1961_1990]; }),
      // x-scale
      x = d3.scale.linear()
          .domain([1900, 2000])
          // .domain([d3.min(surface_temperature, function(d) { return d[0]; }), d3.max(surface_temperature, function(d) { return d[0]; })])
          .nice()
          .range([0, mw])
          .nice(),
      // drag x-axis logic
      downscalex = x.copy(),
      downx = Math.NaN,
      // y-scale (inverted domain)
      y = d3.scale.linear()
          .domain([15, 13])
          // .domain([d3.max(surface_temperature, function(d) { return d[1]; }), d3.min(surface_temperature, function(d) { return d[1]; })])
          .nice()
          .range([0, mh])
          .nice(),
      line = d3.svg.line()
          .x(function(d, i) { return x(surface_temperature[i][0]); })
          .y(function(d, i) { return y(surface_temperature[i][1]); }),
      // drag x-axis logic
      downscaley = y.copy(),
      downy = Math.NaN,
      dragged = null,
      selected = surface_temperature[0];

  var vis = d3.select("#chart").append("svg:svg")
      .attr("width", size[0] + padding[3] + padding[1])
      .attr("height", size[1] + padding[0] + padding[2])
      // .style("background-fill", "#FFEEB6")
      .append("svg:g")
        .attr("transform", "translate(" + padding[3] + "," + padding[0] + ")");

  var graph = vis.append("svg:rect")
      .attr("width", size[0])
      .attr("height", size[1])
      // .attr("stroke", "none")
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().on("zoom", redraw))
      .on("mousedown", function() {
        if (d3.event.altKey) {
            surface_temperature.push(selected = dragged = d3.svg.mouse(vis.node()));
            update();
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
      });

  vis.append("svg:path")
      .attr("class", "line")
      .attr("d", line(surface_temperature));

  d3.select(window)
      .on("mousemove", mousemove)
      .on("mouseup", mouseup)
      .on("keydown", keydown);

  function update() {
    var lines = vis.select("path").attr("d", line(surface_temperature)),
        x_extent = x.domain()[1] - x.domain()[0];
        
    var circle = vis.selectAll("circle")
        .data(surface_temperature, function(d) { return d; });

    circle.enter().append("svg:circle")
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d[0]); })
        .attr("cy",    function(d) { return y(d[1]); })
        .attr("r", 4.0)
        // .attr("r", function(d) { return 800 / (x.domain()[1] - x.domain()[0]); })
        .on("mousedown", function(d) {
          selected = dragged = d;
          update();
        })
      .transition()
        .duration(300)
        .ease("elastic")
        .attr("r", 2.0);
        // .attr("r", function(d) { return 400 / (x.domain()[1] - x.domain()[0]); });

    circle
        .attr("class", function(d) { return d === selected ? "selected" : null; })
        .attr("cx",    function(d) { return x(d[0]); })
        .attr("cy",    function(d) { return y(d[1]); });

    circle.exit().remove();

    if (d3.event && d3.event.keyCode) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }


  function mousemove() {
    if (!dragged) return;
    var m = d3.svg.mouse(vis.node());
    dragged[0] = x.invert(Math.max(0, Math.min(size[0], m[0])));
    dragged[1] = y.invert(Math.max(0, Math.min(size[1], m[1])));
    update();
  }

  function mouseup() {
    if (!dragged) return;
    mousemove();
    dragged = null;
  }

  function keydown() {
    if (!selected) return;
    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: { // delete
        var i = surface_temperature.indexOf(selected);
        surface_temperature.splice(i, 1);
        selected = surface_temperature.length ? surface_temperature[i > 0 ? i - 1 : 0] : null;
        update();
        break;
      }
    }
  }

  redraw();

  function redraw() {
    if (d3.event && d3.event.transform && isNaN(downx) && isNaN(downy)) {
        d3.event.transform(x, y);
    };

    var fx = x.tickFormat(10),
        fy = y.tickFormat(10);

    // Regenerate x-ticks…
    var gx = vis.selectAll("g.x")
        .data(x.ticks(10), String)
        .attr("transform", tx);

    gx.select("text")
        .text(fx);

    var gxe = gx.enter().insert("svg:g", "a")
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("svg:line")
        .attr("stroke", stroke)
        .attr("y1", 0)
        .attr("y2", size[1]);

     gxe.append("svg:text")
         .attr("y", size[1])
         .attr("dy", "1em")
         .attr("text-anchor", "middle")
         .text(fx)
         .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
         .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
         .on("mousedown", function(d) {
              var p = d3.svg.mouse(vis[0][0]);
              downx = x.invert(p[0]);
              downscalex = null;
              downscalex = x.copy();
              // d3.behavior.zoom().off("zoom", redraw);
         });
      

    gx.exit().remove();

    // Regenerate y-ticks…
    var gy = vis.selectAll("g.y")
        .data(y.ticks(10), String)
        .attr("transform", ty);

    gy.select("text")
        .text(fy);

    var gye = gy.enter().insert("svg:g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");

    gye.append("svg:line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", size[0]);

    gye.append("svg:text")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown", function(d) {
             var p = d3.svg.mouse(vis[0][0]);
             downy = y.invert(p[1]);
             downscaley = y.copy();
             // d3.behavior.zoom().off("zoom", redraw);
        });
      

    gy.exit().remove();
    update();

  }

  // attach the mousemove and mouseup to the body
  // in case one wonders off the axis line

  d3.select('body')
    .on("mousemove", function(d) {
      var p;
      if (!isNaN(downx)) {
        var 
          p = d3.svg.mouse(vis[0][0]),
          rupx = downscalex.invert(p[0]),
          xaxis1 = downscalex.domain()[0],
          xaxis2 = downscalex.domain()[1],
          xextent = xaxis2 - xaxis1;
        if (rupx != 0) {
            var changex, new_domain;
            changex = downx / rupx;
            new_domain = [xaxis1, xaxis1 + (xextent * changex)];
            x.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      };
      if (!isNaN(downy)) {
          p = d3.svg.mouse(vis[0][0]),
          rupy = downscaley.invert(p[1]),
          yaxis1 = downscaley.domain()[1],
          yaxis2 = downscaley.domain()[0],
          yextent = yaxis2 - yaxis1;
        if (rupy != 0) {
            var changey, new_domain;
            changey = downy / rupy;
            new_domain = [yaxis1 + (yextent * changey * 1.05), yaxis1];
            y.domain(new_domain);
            redraw();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    })
    .on("mouseup", function(d) {
        if (!isNaN(downx)) {
            redraw();
            downx = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        if (!isNaN(downy)) {
            redraw();
            downy = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
            // graph.call(d3.behavior.zoom().on("zoom", redraw));
        };
        // d3.event.preventDefault();
        // d3.event.stopPropagation();
    });
};
})();

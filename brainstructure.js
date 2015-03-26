var w = 1120,
    h = 600,
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([0, h]);

var brain_h = 500,
    brain_w = 500;

var vis = d3.select("#icicle").append("div")
    .attr("class", "chart")
    .style("width", w + "px")
    .style("height", h + "px")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

var partition = d3.layout.partition()
    .value(function(d) { return d.size; });

var addSizes = function(root) {
  var children = root.children;
  if (children.length == 0) {
    root.size = 1;
  }
  else {
    for (var i = 0; i < children.length; i++) {
      addSizes(children[i]);
    }
  }
}

var BFSdebug;
var test = [];
function structBFS(root, struct_id) {
  test.push(root.id);
  console.log('root: ' + root.id);
  if (struct_id == root.id) {
    console.log('found match!');
    var path = [root]
    while (root.parent != null) {
      root = root.parent;
      path.insert(0, root);
    }
    BFSdebug = path;
    return path;
  }
  else {
    var children = root.children;
    if (children != null) {
      for (var i = 0; i < children.length; i++) {
        structBFS(children[i], struct_id);
      }
    }
  }
}



var highlightPath = function (path_route, color) {
  // Select d3 path route.
  var d3_path = d3.select("body");
  for (var i = 0; i < path_route.length; i++) {
    var r = path_route[i];
    if (d3_path[0][0] != null)
      d3_path = d3_path.selectAll(r);
    else
      return null;
  }
  d3_path.style("fill", function (data) { return color; });
}


var tempdebug;
var dslice_id;
var highlightSubtree = function (root, slice_id, highlight, debug) {
  debug.push(root);
  tempdebug = debug;
  dslice_id = slice_id;

  if (root.slice_ids_enum != null) {
    var all_slices = root.slice_ids_enum;
    var slices = all_slices[slice_id];
    if (slices) {
      for (var i = 0; i < slices.length; i++) {
        var tempcolor;
        if (highlight) {
          tempcolor = "red";
        } else {
          tempcolor = "#" + root.color_hex_triplet;
        }
        highlightPath(root.path_routes[slices[i]], tempcolor);
      }
    }
  }
  var children = root.children;
  if (children != undefined && children != null) {
    for (var i = 0; i < children.length; i++) {
      highlightSubtree(children[i], slice_id, highlight, debug);
    }
  }
}


// Helper function for dealing with the weirdness of xml. Find the first
// child of elem "n" that is of type "element".
// Adapted from: http://www.w3schools.com/dom/prop_element_firstchild.asp
var get_firstchild = function (n) {
  var localfirstchild = n.firstChild;
  while (localfirstchild.nodeType != 1) {
    localfirstchild = localfirstchild.nextSibling;
  }
  return localfirstchild;
}


//var getWikiSummary = function(name) {
//     jQuery.getJSON('http://ucsc-perception.org/welcome/default/getwikisummary.jsonp&callback=?', function(data) {
//     console.log(data);
//     d3.select("#tooltip")
//         .select("#value")
//         .html(data);
//    })
//    .error(function(error) { alert("error"); }) 
//    .jsonpCallback(function() { console.log('hello world'); });
//}
    
//var getWikiSummary = function(name) {
//  $.ajax('http://ucsc-perception.org/welcome/default/getwikisummary.jsonp&callback=?', {
//    crossDomain: true,
//    dataType: 'jsonp',
//    jsonpCallback:  function(data) {
//        console.log('hello world');
//        console.log(data);
//        d3.select("#tooltip")
//          .select("#value")
//          .html(data);
//        }
//  })
//}

var xml_elem;

// Load all of the slices.
d3.json("extra/slices.json", function (filenames) {
    d3.select("#brain")
        .append("svg:svg")
        .attr("id", "brain_svg")
        .attr("width", w)
        .attr("height", h);

    for (var i = 0; i < filenames.length; i++) {
      d3.xml("svgslices/" + filenames[i], "images/svg+xml", function (xml) {
        var brain_svg = document.getElementById("brain_svg");
        xml_elem = get_firstchild(xml.documentElement);
        brain_svg.appendChild(xml_elem);

        var slice_id = "p" + get_firstchild(xml_elem).attributes.id.value
        xml_elem.setAttribute("id",slice_id);
        xml_elem.setAttribute("visibility", "hidden");
        xml_elem.setAttribute("class", "slice_svg");
        xml_elem.setAttribute("transform", "scale(0.00625)");

      });
    }

});

d3.json("allencurrent.json", function(root) {
  debug = root;

  var g = vis.selectAll("g")
      .data(partition.nodes(root))
    .enter().append("svg:g")
      .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
      .on("click", click);

  var kx = w / root.dx,
      ky = h / 1;

  var mouseover = function(d, slice_id) {
     d3.select("#" + slice_id).attr("visibility", "visible");
     highlightSubtree(d, slice_id, true, []);
      d3.select("#tooltip")
        .select("#value")
        .html(d.summary);
  }

  var mouseout = function(d, slice_id) {
    d3.select("#tooltip").classed("hidden", true);
    d3.selectAll("#" + slice_id).attr("visibility", "hidden");
    highlightSubtree(d, slice_id, false, []);
  }

  g.append("svg:rect")
      .attr("width", root.dy * kx)
      .attr("id", function(d) { return  d.id; })
      .attr("best_slice", function(d) { if (d.best_slice) return d.best_slice.id; })
      .attr("height", function(d) { return d.dx * ky; })
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .style("fill", function(d) { return '#' + d.color_hex_triplet; })
      .on("mouseover", function (d) { 
          mouseover(d, d.best_slice.id);
      }).on("mousemove", function(d){
        d3.select("#tooltip")
          .classed("hidden", false)
          .style("left", event.pageX + "px")
          .style("top", event.pageY + 20 + "px");
      })
      .on("mouseout", function (d) {
        mouseout(d, d.best_slice.id);
      })

  g.append("svg:text")
      .attr("transform", transform)
      .attr("dy", ".35em")
      .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
      .text(function(d) { return d.name; });

  d3.select(window)
      .on("click", function() { click(root); })

  function click(d) {
    if (!d.children) return;

    kx = (d.y ? w - 40 : w) / (1 - d.y);
    ky = h / d.dx;
    x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
    y.domain([d.x, d.x + d.dx]);

    var t = g.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

    t.select("rect")
        .attr("width", d.dy * kx)
        .attr("height", function(d) { return d.dx * ky; });

    t.select("text")
        .attr("transform", transform)
        .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });

    d3.event.stopPropagation();
  }

  function transform(d) {
    return "translate(8," + d.dx * ky / 2 + ")";
  }

//  d3.select("#tooltip")
//    .style("left", 200 + "px")
//    .style("top", 200 + "px")
//    .select("#value")
//    .text("Some sort of data.")
//  d3.select("#tooltip").classed("hidden", false);
});

var height = 500;
var width = 700;
var padding = 40;

var episodes = [1, 2, 3, 5, 6];
var totalData;
var currentData;
var dFirst;

var OFFSET = 23;
var NORMAL_WIDTH = 6;
var SELECT_WIDTH = 8;
var NORMAL_OPACITY = 0.1;
var SELECT_OPACITY = 1;

var colors = {
    "A": "#fb9fcb",
    "B": "#ff951c",
    "C": "#fff200",
    "D": "#00a500",
    "F": "gray"
}

var numbers = {
    "A": 0,
    "B": 1,
    "C": 2,
    "D": 3,
    "F": 4
}

// Set up plot
var svg = d3.select("#plot").append("svg")
.attr("class", "axis")
.attr("height", height + padding * 2)
.attr("width", width + padding * 2);

var scaleX = d3.scaleLinear().domain([0, episodes.length-1]).range([0, width]);
var scaleY = d3.scaleLinear().domain([0, 99]).range([0, height]);
var plot = svg.append("g").attr("transform", "translate(" + padding + "," + padding + ")");

setXAxis();

// Get data
d3.csv("produce101.csv", parseLine, function (error, data) {
    totalData = processData(data);
    plotData(data);
    selectLine(dFirst, "#line1");

    // drawPie("#pie", getPieData(100));
    // drawPie("#pie60", getPieData(60));

    var currentData = getCurrentContestants();
    showTop("currentRank", true);
});

// Path generator
var pathGenerator = d3.line()
.x(function (d) { return scaleX(d.x); })
.y(function (d) { return scaleY(d.rank); });

// Set notes
for (var i = 0; i < episodes.length; i++) {
    $("#note" + i).css("left", scaleX(i) + OFFSET).hide();
}

resetLines();

/*
 GENERAL FUNCTIONS
 --------------------- */

 function processData(data) {
     data.forEach(function(d) {
         d["latestRank"] = getLatestRank(d);
         d["currentRank"] = getCurrentRank(d);
         d["isEliminated"] = isEliminated(d);
         d["rankChange"] = getRankChange(d);
     })
     return data;
 }

 function isEliminated(d) {
     return (d.ranking == undefined || d.ranking.length < episodes.length);
 }

// Returns current contestants
function getCurrentContestants() {
    var currentData = [];
    totalData.forEach(function(d) {
        if (!isEliminated(d)) {
            currentData.push(d);
        }
    });
    return currentData;
}

function sortByKey(array, key, asc) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        if (asc) {
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        }
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}

var sortAsc = true;

function toggleSort(key) {
    if ($("#" + key).hasClass("selectedSort")) { // Toggle on this key
        sortAsc = !sortAsc;
    } else { // Sort true
        $("#top th").removeClass("selectedSort");
        $("#" + key).addClass("selectedSort");
        sortKey = key
        sortAsc = true;
    }
    showTop(key, sortAsc);
}

// Update chart
function showTop(key, asc) {
    var sortedData = sortByKey(getCurrentContestants(), key, asc);

    var top = d3.select("#topBody");

    top.selectAll("tr.top").remove();
    var topDivs = top.selectAll("tr.top").data(sortedData);

    topDivs.enter().append("tr")
        .attr("class", "top")
        .html(function(d) {
            var letter = '<div class="letter" style="background: ' + getColor(d) + '; color: ' + getTextColor(d) + '">' + d.letter + '</div>';
            return td(d["latestRank"]) + td(d.name) + td(d.company) + td(letter) + td(displayRankChange(d.rankChange));
        })
        .on("click", function(d) {
            $(".top").removeClass("selectedRow");
            $(this).addClass("selectedRow");
            selectLine(d, "#line" + d["latestRank"]);
        });
 }

 function td(str) {
     return "<td>" + str + "</td>";
 }

 function setXAxis() {
     episodes.forEach(function(episode,i) {
         // Add episode label
         plot.append("text")
            .text("Episode " + episode)
            .attr("x", scaleX(i) )
            .attr("y", -20)
            .attr("class", "episodeLabel smallCaps");

        // Add gridline
        plot.append("path")
            .attr("d", "M" + scaleX(i) + "," + scaleY(0) + "L" + scaleX(i) + "," + scaleY(99))
            .style("opacity", "0.1")
            .style("stroke-width", 3);
     });
 }

// Displays profile
function displayProfile(d) {
    $("#pic").attr("src", getImageSource(d));
    $("#infoName").text(d["name"]);
    $("#infoLetter")
        .text(getLetter(d))
        .css("background", getColor(d))
        .css("color", getTextColor(d));
    $("#infoCompany").text(d["company"]);
    $("#infoRank").html(getRankInfo(d));
}

function getImageSource(d) {
    return "pics/" + d["name"].replace(/ /g, "") + ".jpg";
}

function getColor(d) {
    return colors[getLetter(d)];
}

function resetLines() {
    plot.selectAll("path.ranking")
        .style("opacity", NORMAL_OPACITY)
        .style("stroke-width", NORMAL_WIDTH);
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// Select line indicated by lineId
function selectLine(d, lineId) {
    // Hide other lines
    plot.selectAll("path.ranking").style("opacity", NORMAL_OPACITY);

    // Move line to front and select
    var line = d3.select(lineId);
    line.moveToFront();
    line.style("opacity", SELECT_OPACITY).style("stroke-width", SELECT_WIDTH);

    // Show notes
    updateNotes(d);

    // Update box
    displayProfile(d);
    $("#profile").show();
    $("#profile").css("top", getInfoTop(d));
}


function getLowestRank(data) {
    var min = 100;
    data.forEach(function(d) {
        d.ranking.forEach(function(d2) {
            if (d2 < min) {
                min = d2;
            }
        })
    })
    return min;
}

function plotData(data) {

    // Update y axis
    scaleY.domain([1, getLowestRank(data)]);

    var paths = plot.selectAll("path.ranking").data(data);



    var pathGenerator = d3.line()
    .x(function (d) { return scaleX(d.x); })
    .y(function (d) { return scaleY(d.rank); });

    paths.enter().append("path")
        .attr("class", "ranking")
        .attr("id", function(d) {
            if (d["latestRank"] == 1) {
                dFirst = d;
            }
            return "line" + d["latestRank"];
        })
        .attr("d", function(d, i) {
            return pathGenerator(d.ranking);
        })
        .style("stroke", function(d, i) {
            return getColor(d);
        })
        .style("stroke-width", NORMAL_WIDTH)
        .on("mouseover", function (d) {
            selectLine(d, this);
        })
        .on("mouseout", function(d) {
            resetLines();

            // Hide notes and box
            $(".note").hide();
            $("#profile").hide();
        });

    paths.exit().remove();
}

// Returns the latest rank for every contestant, and -1 for those never ranked
function getLatestRank(d) {
    var ranking = d.ranking[d.ranking.length - 1];
    if (ranking == undefined) {
        return -1;
    }
    return ranking.rank;
}

// Returns the rank for current contestants, and -1 for all those eliminated
function getCurrentRank(d) {
    if (isEliminated(d)) {
        return -1;
    }
    return getLatestRank(d);
}

// Returns the change in rank, or "" for eliminated contestants
function getRankChange(d) {
    if (d.isEliminated) {
        return "";
    }
    var prevRank = d.ranking[d.ranking.length - 2].rank;
    return prevRank - getCurrentRank(d);
}

// Returns rank with image according to [change], which must be a number
function displayRankChange(change) {
    if (change > 0) {
        return "<img src='img/up-arrow.png' class='arrow'><span class='change up'>" + change + '<span>';
    } else if (change < 0) {
        return "<img src='img/down-arrow.png' class='arrow'><span class='change down'>" + Math.abs(change) + '<span>';
    } else {
        return "<span class='change'>0</span>";
    }
    return
}

// Returns the change for current contestants, or shows elimination
function getRankInfo(d) {
    if (isEliminated(d)) {
        return "Eliminated in Episode " + episodes[d.ranking.length - 1];
    }
    return "Rank " + d["currentRank"] + " " + displayRankChange(getRankChange(d));
}

function getInfoTop(d) {
    var lastRank = d["latestRank"];
    var top = scaleY(lastRank) + 35;
    return Math.min(195, top);
}

function updateNotes(d) {
    $(".note").show();
    for (var i = 0; i < episodes.length; i++) {
        // No ranking, contestant dropped at this point -- hide note
        if (d.ranking[i] == undefined) {
            $("#note" + i).hide();
        } else { // Show rank
            var rank = d.ranking[i].rank;
            $("#note" + i)
                .text(rank)
                .css("top", scaleY(rank) + OFFSET)
                .css("background", getColor(d))
                .css("color", getTextColor(d));
        }
    }
}

// Get color of note text (all white except for yellow rank C)
function getTextColor(d) {
    if (getLetter(d) == "C") {
        return "black";
    }
    return "white";
}

// Return rank or -1 if no rank (eliminated)
function getRank(n) {
    if (n == "-") {
        return -1;
    }
    return Number(n);
}

// Parse line of csv to return a new row with episode, x, rank, and rankings[]
function parseLine(row) {
    var r = {};
    r["name"] = row["Name"];
    r["company"] = row["Company"];
    r["letter"] = row["Re-Evaluation"];
    r["ranking"] = [];
    episodes.forEach(function(episode, i) {
        var rank = getRank(row["ep" + episode]);
        if (rank > 0) {
            var o = {};
            o["episode"] = episode;
            o["x"] = i;
            o["rank"] = rank;
            r["ranking"].push(o);
        }
    })
    return r;
}

function getLetter(d) {
    return d["letter"];
}

// Converts letter to index number
function letterToIndex(l) {
    var letters = {
        "A": 0,
        "B": 1,
        "C": 2,
        "D": 3,
        "F": 4
    }
    return letters[l];
}

function getIndex(d) {
    return letterToIndex(getLetter(d));
}

// Get pie for contestants above rank n
function getPieData(n) {

    // Set up empty pieData
    var pieData = [];
    ["A", "B", "C", "D", "F"].forEach(function(d, i) {
        var obj = {};
        obj.letter = d;
        obj.count = 0;
        obj.contestants = [];
        pieData.push(obj);
    });

    totalData.forEach(function(d) {
        if (d.ranking != undefined && d["latestRank"] <= n) {
            pieData[getIndex(d)].count += 1;
            pieData[getIndex(d)].contestants.push(d);
        }
    });
    return pieData;
}

function updatePieInfo(d) {
    d3.select("#pieInfo").append("div");
}

function drawPie(id, data) {
    var width = 300;
    var height = 300;
    var padding = 10;

    var radius = Math.min(width, height)/2;

    var svg = d3.select(id)
        .attr("width", width)
        .attr("height", height);

    var radius = Math.min(width, height) / 2;
    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var pie = d3.pie()
        .sort(function(a, b) {
    		return a.letter.localeCompare(b.letter);
    	})
        .value(function(d) { return d.count; });

    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var label = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    var arc = g.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
            .attr("class", "arc");

    arc.append("path")
      .attr("d", path)
      .attr("fill", function(d) { return getColor(d.data) })
      .on("mouseover", function(d) {
          updatePieInfo(d);
      });

    arc.append("text")
      .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
      .attr("dy", "0.35em")
      .attr("class", "smallCaps")
      .text(function(d) { return d.data.count; });
}

function translate(x, y) {
    return "translate(" + x + "," + y + ")";
}
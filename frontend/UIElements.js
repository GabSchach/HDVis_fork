//Function: setUI
//specified functions are called, that then add interactive elements to page (filter, legend,...)
//
//Parameters:
//functions - array of functions that add interactive elements
function setUI(functions) {
    functions.forEach(func => {
        try {
            func();
        } catch (error) {
            console.log("function ", func, " was not found!", error);
        }
    })
}

//Function: showAll
//adds button that expands or collapses visualization
function showAll() {
    const anchor = document.getElementById("menuLeft");
    const button = document.createElement("button");
    button.setAttribute("id", "showAll");
    button.onclick = function () {
        if (!showAllNodes) {
            showAllNodes = true;
            setScenarioData().then(r => {
                handler.render();
                this.innerHTML = "collapse all";
            });
        } else {
            showAllNodes = false;
            setScenarioData().then(r => {
                handler.render();
                this.innerHTML = "expand all";
            });
        }

    }
    button.appendChild(document.createTextNode(showAllNodes ? "collapse all" : "expand all"));
    anchor.appendChild(button);


}

//Function: backToOverview
//adds button that resets visualization and shows scenario overview
function backToOverview() {
    const anchor = document.getElementById("menuLeft");
    const backButton = document.createElement("button")
    backButton.setAttribute("id", "backButton")
    backButton.onclick = async function () {
        removeUIElements();
        resetViewer();
        await overviewViewer();
    }

    backButton.appendChild(document.createTextNode("back"));
    anchor.appendChild(backButton);

}

//Function: legend
//adds button that builds legend using contents of nodeMap, edgeMap, handler
function legend() {

    let currentNodeIds;
    let currentNodes;
    let distinctColors;
    let distinctShapes;

    function loadItems() {
        currentNodeIds = handler.getNodeIds();

        currentNodes = currentNodeIds.map(nodeId => {
            return nodeMap.get(nodeId);
        })

        distinctColors = [...new Set(currentNodes.map((node) => node.properties[settings.graph.groupingVariable]))]
        distinctColors.push("origin")
        distinctShapes = [...new Set(currentNodes.map((node) => {
            return node.labels[0]
        }))];
    }

    const anchor = document.getElementById("menu");


    const expandContainer = document.createElement("div");
    expandContainer.setAttribute("id", "expandLegend")
    expandContainer.innerHTML = "☰"
    expandContainer.addEventListener("click", showLegend);
    anchor.appendChild(expandContainer)

    function showLegend() {
        if (document.getElementById("legend") === null) {
            buildLegend();
        } else {
            document.getElementById("legend").style.width = "600px";
        }
    }

    function buildLegend() {
        loadItems()

        //legend
        const legend = document.createElement("div");
        legend.setAttribute("class", "legend");
        legend.setAttribute("id", "legend");

        //collapse button
        const collapseElem = document.createElement("div");
        collapseElem.setAttribute("id", "legendCollapse");
        const title = document.createElement("h2");
        title.innerText = "Legend"
        collapseElem.appendChild(title)
        const collapseButton = document.createElement("h2")
        collapseButton.innerHTML += "×";
        collapseButton.addEventListener("click", collapseLegend);
        collapseButton.setAttribute("id", "collapseButton")
        collapseElem.appendChild(collapseButton);
        legend.appendChild(collapseElem);

        //Element symbols
        const symbolElem = document.createElement("div");
        symbolElem.setAttribute("id", "nodeSymbols");
        symbolElem.setAttribute("class", "legendElement");
        symbolElem.innerHTML = `<h3>Symbols</h3><hr />`;
        const symbolList = document.createElement("div");
        symbolList.setAttribute("class", "legendItems")

        distinctShapes.forEach(shape => {
            const item = document.createElement("div");
            item.setAttribute("class", "legendItem");
            item.innerHTML = `<img src=` + settings.database.springURI + `/symbol/` + shape + `.svg alt=` + shape + `  style="height:3em">`;
            item.innerHTML += shape;

            symbolList.appendChild(item)
        })
        symbolElem.appendChild(symbolList)
        legend.appendChild(symbolElem)

        //Element colors
        const colorElem = document.createElement("div");
        colorElem.setAttribute("id", "nodeColors");
        colorElem.setAttribute("class", "legendElement");
        colorElem.innerHTML = `<h3>Colors</h3><hr />`;
        const colorList = document.createElement("div");
        colorList.setAttribute("class", "legendItems")

        distinctColors.forEach(color => {
            const item = document.createElement("div");
            item.setAttribute("class", "legendItem");
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttributeNS(null, 'height', 50);
            svg.setAttributeNS(null, 'width', 50);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttributeNS(null, 'cx', 25);
            circle.setAttributeNS(null, 'cy', 25);
            circle.setAttributeNS(null, 'r', 24);
            circle.setAttributeNS(null, 'stroke', "black");
            circle.setAttributeNS(null, 'style', 'fill: ' + getColor(color) + '; stroke-width: 1px;')
            svg.appendChild(circle)
            item.appendChild(svg);
            const text = document.createElement("p");
            text.innerText += color;
            item.appendChild(text);

            colorList.appendChild(item)
        })
        colorElem.appendChild(colorList)
        legend.appendChild(colorElem)


        //append anchor with legend
        anchor.appendChild(legend)
        document.getElementById("legend").style.width = "600px";
    }

    function collapseLegend() {
        document.getElementById("legend").style.width = "0";
    }
}

//Function: filterEdgesByContent
//adds several elements for highlighting node details / edge contents by search terms
function filterEdgesByContent() {
    const anchor = document.getElementById("menuLeft");

    const src = `
  <select id="filterSelect">
      <option value="edge" selected>filter by edge</option>
      <option value="node" >filter by node</option>
  </select>
  <input type="search" id="contFilter" name="contFilter" placeholder="filter edge by contents">
  <button id="filterSubmit" value="filter">filter</button>
  <button id="filterReset">reset</button>`

    const filter = document.createElement("div");
    filter.setAttribute("id", "uiGroup");
    filter.innerHTML = src;
    anchor.appendChild(filter);

    const filterSubmit = document.getElementById("filterSubmit")
    const filterReset = document.getElementById("filterReset")
    const filterSelect = document.getElementById("filterSelect")
    filterSubmit.onclick = contentFilter
    filterReset.onclick = resetContentFilter;
    filterSelect.onchange = selectFilter;

    function selectFilter() {
        const value = filterSelect.value;
        const inputField = document.getElementById("contFilter");
        if (value === "edge") {
            inputField.placeholder = "filter edge by contents";
        }
        if (value === "node") {
            inputField.placeholder = "filter node by details";
        }
    }

    function contentFilter() {
        const value = document.getElementById("contFilter").value;
        const selection = filterSelect.value;
        if (value === "") {
            return;
        }

        d3.selectAll(".node").style("opacity", 0.1);
        d3.selectAll(".edge").style("opacity", 0.1);
        d3.selectAll(".cluster").style("opacity", 0.3);

        if (selection === "edge") {
            d3.selectAll(".edge").each(DOMEdge => {

                const Ids = DOMEdge.attributes.id.split(",");
                Ids.forEach(edgeId => {
                    const edge = edgeMap.get(edgeId);

                    if (edge.properties.content !== undefined && edge.properties.content.find(elem => elem.includes(value)) !== undefined) {

                        d3.select(".edge[id='" + DOMEdge.attributes.id + "']").style("opacity", 1);
                        d3.select(".node[id='" + edge.source + "']").style("opacity", 1);
                        d3.select(".node[id='" + edge.target + "']").style("opacity", 1);

                        let edgeParent = edge.source;
                        while (childParentMap.has(edgeParent)) {
                            edgeParent = childParentMap.get(edgeParent);
                            d3.select(".node[id='" + edgeParent + "']").style("opacity", 1);
                        }

                        edgeParent = edge.target;
                        while (childParentMap.has(edgeParent)) {
                            edgeParent = childParentMap.get(edgeParent);
                            d3.select(".node[id='" + edgeParent + "']").style("opacity", 1);
                        }
                    }
                })
            });
        }

        if (selection === "node") {
            d3.selectAll(".node").each(DOMNode => {
                const currentId = DOMNode.attributes.id;
                let id = [];
                id.push(DOMNode.attributes.id);
                if (parentChildMap.has(id[0])) {
                    id = parentChildMap.get(id[0]);
                }

                id.forEach(id => {
                    const node = nodeMap.get(id);
                    if (node!==undefined && node.properties.hasOwnProperty("details") && node.properties.details.includes(value)) {
                        d3.select(".node[id='" + currentId + "']").style("opacity", 1);
                    }

                })
            })
        }
    }

    async function resetContentFilter() {

        const selection = filterSelect.value;
        document.getElementById("contFilter").value = "";
        if (selection === "edge") {
            document.getElementById("contFilter").placeholder = "filter edge by contents";
        }
        if (selection === "node") {
            document.getElementById("contFilter").placeholder = "filter node by details";
        }
        d3.selectAll(".node").style("opacity", 1);
        d3.selectAll(".edge").style("opacity", 1);
    }
}

//Function: removeUIElements
//removed all elements from menu bar at the top of the page
function removeUIElements() {
    const anchor = document.getElementById("menu");
    const range = new Range();
    range.selectNodeContents(anchor);
    range.deleteContents();

    const menuLeft = document.createElement("div");
    menuLeft.setAttribute("id", "menuLeft");
    anchor.appendChild(menuLeft);
}
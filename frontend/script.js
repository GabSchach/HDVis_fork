// Variable: edgeData
// array of all edges
let edgeData;

// Variable: nodeData
// array of all nodes
let nodeData;

// Variable: edgeMap
// Map of all edges with ids as key
let edgeMap;

// Variable: nodeMap
// Map of all nodes with ids as key
let nodeMap;

// Variable: childRootMap
//map of all child nodes to rootNodes
let childRootMap = new Map();

// Variable: parentChildMap
//map of all parent nodes to all direct/indirect children
let parentChildMap = new Map();

// Variable: childParentMap
//map of all child nodes to direct parent nodes
let childParentMap = new Map();

// Variable: parentDirectChildMap
//map parent nodes to direct children
let parentDirectChildMap = new Map();

// Variable: handler
//instance of DotHandler
let handler;

// Variable: showAllNodes
//whether all nodes are shown by default
let showAllNodes = settings.graph.showNodes;

// Variable: currentColorSet
// color set that is currently used
let currentColorSet = settings.graph.colorSet.slice();

// Variable: currentGroupColors
// colors that are currently assigned
let currentGroupColors = settings.groupColors;

let infobox = d3.select("body").selectAll("div.infoBox").data([1]).join("div").attr("class", "infoBox").attr("id", "infoBox").style("opacity", 1);
infobox = d3.select("#infoBox");

//Function: init
//called when page is loaded; starts initial visualization
function init() {
    overviewViewer().then(r => {});
}

//Function: setNeatoSettings
//passes settings for scenario overview to DotHandler object
function setNeatoSettings() {
    handler.setGraphSettings(settings.overviewNeatoSettings.graphSettings);
    handler.setNodeSettings(settings.overviewNeatoSettings.nodeSettings);
    handler.setEdgeSettings(settings.overviewNeatoSettings.edgeSettings);
}

//Function: neatoInteractionHandler
//function containing all interactivity possible with scenario overview visualization
function neatoInteractionHandler() {
    let nodes = d3.selectAll('.node');

    nodes.on("click", (event, d) => {
        const id = d.attributes.id
        if (nodeMap.has((id))) {
            const nodeId = nodeMap.get((id))
            resetViewer();
            removeUIElements();
            scenarioViewer(nodeId);
        } else {
            console.log("The center is not a selectable scenario")
        }
    });

}

//Function: setDotSettings
//passes settings for scenario viewer to DotHandler object
function setDotSettings() {
    handler.setGraphSettings(settings.scenarioDotSettings.graphSettings);
    handler.setNodeSettings(settings.scenarioDotSettings.nodeSettings);
    handler.setEdgeSettings(settings.scenarioDotSettings.edgeSettings)
}

//Function: setScenarioData
//fetched all data for specified scenario, sets variables above and passes graph data to DotHandler
//
//Parameters:
//scenario - scenario name that is to be added to DotHandler
async function setScenarioData(scenario) {
    handler.resetClusters();
    handler.resetEdges();


    let rootNodes = [];


    let childNodes = [];
    if (parentChildMap.size === 0) {
        const parentChildObject = await getHierarchyByParents(scenario);
        for (let elem in parentChildObject) {
            parentChildMap.set(elem, parentChildObject[elem]);
            rootNodes.push(elem);
            childNodes = [...new Set(childNodes.concat(parentChildObject[elem]))];
        }
        rootNodes.forEach(node => {
            if (childNodes.includes(node)) {
                rootNodes.splice(rootNodes.indexOf(node), 1);
            }
        })
    }


    if (childRootMap.size === 0) {
        for (const node of rootNodes) {
            let arr = await getAllChildrenSpring(node);
            arr.forEach(child => {
                childRootMap.set(child, node);
            })

        }
    }

    if (childParentMap.size === 0) {
        const allParents = await getHierarchyByChildren(scenario);
        childParentMap = new Map(Object.entries(allParents));
        for (let key in allParents) {
            if (parentDirectChildMap.has(allParents[key])) {
                const temp = parentDirectChildMap.get(allParents[key]);
                temp.push(key);
                parentDirectChildMap.set(allParents[key], temp)
            } else {
                parentDirectChildMap.set(allParents[key],[key]);
            }
        }
    }

    const uniqueGroups = [...new Set(nodeData.map((item) => item.properties[settings.graph.groupingVariable]))];

    for (const clusterName of uniqueGroups) {

        let a = new Cluster(clusterName);
        a.setNodeSettings({imagescale: true});
        a.setClusterSettings({color: getColor(clusterName), style: 'rounded, dashed, bold'});

        let clusterNodes = [];

        for (const node of nodeData) {
            const isParent = node.labels.includes("parent");
            const isOrigin = node.labels.includes("origin");

            if (node.properties[settings.graph.groupingVariable] === clusterName) {
                let name = node.properties.name;
                if (node.properties.hasOwnProperty("nameShort")) {
                    name = node.properties.nameShort;
                }

                if (showAllNodes && !node.labels.includes("parent")) {
                    clusterNodes.push({
                        id: node.id,
                        type: node.labels[0],
                        parent: isParent,
                        origin: isOrigin,
                        settings: {
                            id: node.id,
                            label: name,
                            image: await getImage(node.labels[0]),
                            nodeColor: getColor(node)
                        }
                    });
                }
                if (!showAllNodes && !isChild(node.id)) {
                    clusterNodes.push({
                        id: node.id,
                        type: node.labels[0],
                        parent: isParent,
                        origin: isOrigin,
                        settings: {
                            id: node.id,
                            label: name,
                            image: await getImage(node.labels[0]),
                            nodeColor: getColor(node)
                        }
                    });
                }

            }
        }

        a.setNodes(clusterNodes);
        handler.setCluster(a);

    }


    let clusterEdges = [];
    edgeData.forEach((edge) => {
        if (showAllNodes && edge.labels !== "includes") {
            clusterEdges.push({
                source: edge.source,
                target: edge.target,
                settings: {type: edge.labels, id: edge.id}
            });
        } else if (!showAllNodes && edge.labels !== "includes") {
            if (childRootMap.has(edge.source) && childRootMap.has(edge.target)) {
                clusterEdges.push({
                    source: childRootMap.get(edge.source),
                    target: childRootMap.get(edge.target),
                    settings: {type: edge.labels, id: edge.id}
                });
            } else if (childRootMap.has(edge.source)) {
                clusterEdges.push({
                    source: childRootMap.get(edge.source),
                    target: edge.target,
                    settings: {type: edge.labels, id: edge.id}
                });
            } else if (childRootMap.has(edge.target)) {
                clusterEdges.push({
                    source: edge.source,
                    target: childRootMap.get(edge.target),
                    settings: {type: edge.labels, id: edge.id}
                });
            } else if (!childRootMap.has(edge.source) && !childRootMap.has(edge.target)) {
                clusterEdges.push({
                    source: edge.source,
                    target: edge.target,
                    settings: {type: edge.labels, id: edge.id}
                });
            }
        }
    })

    handler.setEdges(clusterEdges);
}

//Function: resetViewer
//resets all global variables stored in this file, destructs DotHandler object thereby resetting entire visualization to enable new viewer to be initialized
function resetViewer() {
    let nodes = d3.selectAll('.node');
    let edges = d3.selectAll('.edge');
    nodes.on("mouseover", null).on("mouseleave", null).on("contextmenu", null).on("mousemove", null).on("mouseout", null);
    edges.on("mousemove", null).on("mouseout", null).on("mouseover", null);
    infobox.on("mouseover", null).on("mouseout", null);
    showAllNodes = settings.graph.showNodes;
    nodeData = [];
    edgeData = [];
    edgeMap = [];
    nodeMap = [];
    parentDirectChildMap = new Map();
    childRootMap = new Map();
    parentChildMap = new Map();
    childParentMap = new Map();
    if (!settings.graph.colorConsistency) {
        currentGroupColors = settings.groupColors;
        currentColorSet = settings.graph.colorSet.slice();
    }
    handler.destruct();
}

//Function: interactionHandler
//function containing all interactivity possible with scenario view graph (collapse/expand, details on hover, ...)
function interactionHandler() {
    let nodes = d3.selectAll('.node');
    let edges = d3.selectAll('.edge');
    let infobox = d3.selectAll('.infoBox');

    infobox.on("mouseover", () => {
        d3.select(".infoBox").style("display", "block");
    }).on("mouseout", () => {
        d3.select(".infoBox").style("display", "none");
    });

    nodes.on("mousemove", (event, d) => {
        buildInfoBox(d, event);
    })
        .on("mouseout ", (event, d) => {
            d3.select(".infoBox").style("display", "none");
        })
        .on("mouseover", () => {
            d3.select(".infoBox").style("display", "block");
        })
        //expand
        .on("click", async (event, d) => {
            if (parentChildMap.has((d.attributes.id))) {
                handler.removeNode(d.attributes.id);
                handler.removeEdgeByNode(d.attributes.id);

                let nodesToAdd = [];

                const nodesToAddTemp = parentDirectChildMap.get(d.attributes.id);
                for (const node of nodesToAddTemp) {
                    if (!nodeMap.has(node)) {
                    } else {
                        nodesToAdd.push(node)
                        const nodeToAdd = nodeMap.get(node);
                        let name = nodeToAdd.properties.name;
                        if (nodeToAdd.properties.hasOwnProperty("nameShort")) {
                            name = nodeToAdd.properties.nameShort;
                        }
                        const isParent = nodeToAdd.labels.includes("parent");
                        const isOrigin = nodeToAdd.labels.includes("origin");

                        handler.addNode(nodeToAdd.properties[settings.graph.groupingVariable], {
                            id: nodeToAdd.id,
                            type: nodeToAdd.labels[0],
                            parent: isParent,
                            origin: isOrigin,
                            settings: {
                                id: nodeToAdd.id,
                                label: name,
                                image: await getImage(nodeToAdd.labels[0]),
                                nodeColor: getColor(nodeToAdd)
                            }
                        });
                    }
                }

                edgeData.forEach(edge => {
                    if (edge.labels !== "includes" && ((nodesToAdd.includes(childParentMap.get(edge.source)) || nodesToAdd.includes(childParentMap.get(edge.target))) || (nodesToAdd.includes(edge.target) || nodesToAdd.includes(edge.source)))) {
                        let source = edge.source;
                        let target = edge.target;

                        if (childParentMap.has(edge.target) && nodesToAdd.includes(childParentMap.get(edge.target))) {
                            target = childParentMap.get(edge.target);
                        }
                        if (childParentMap.has(edge.source) && nodesToAdd.includes(childParentMap.get(edge.source))) {
                            source = childParentMap.get(edge.source)
                        }

                        if (!handler.hasNode(edge.source)) {
                            let currentNode = edge.source;

                            while (!handler.hasNode(currentNode)) {
                                currentNode = childParentMap.get(currentNode);

                            }
                            source = currentNode

                        }
                        if (!handler.hasNode(edge.target)) {
                            let currentNode = edge.target;
                            while (!handler.hasNode(currentNode)) {
                                currentNode = childParentMap.get(currentNode);

                            }
                            target = currentNode
                        }

                        handler.addEdge({
                            source: source,
                            target: target,
                            settings: {type: edge.labels, id: edge.id}
                        });
                    }
                })
                handler.render();
            }

        })
        //collapse
        .on("contextmenu", async (event, d) => {

            if (childParentMap.has((d.attributes.id))) {
                const parentID = childParentMap.get((d.attributes.id));
                const parent = nodeMap.get(parentID);

                const childrenIDs = parentChildMap.get(parentID);

                const removedEdges = []
                childrenIDs.forEach(childID => {

                    removedEdges.push([childID, handler.removeEdgeByNode(childID)]);
                    handler.removeNode(childID)
                })

                const isParent = parent.labels.includes("parent");
                const isOrigin = parent.labels.includes("origin");

                let name = parent.properties.name;
                if (parent.properties.hasOwnProperty("nameShort")) {
                    name = parent.properties.nameShort;
                }

                handler.addNode(parent.properties[settings.graph.groupingVariable], {
                    id: parent.id,
                    type: parent.labels[0],
                    parent: isParent,
                    origin: isOrigin,
                    settings: {
                        id: parent.id,
                        label: name,
                        image: await getImage(parent.labels[0]),
                        nodeColor: getColor(parent)
                    }
                });

                removedEdges.forEach(elem => {
                    elem[1].forEach(edgeID => {
                        const edge = (edgeMap.get(edgeID));
                        if (edgeID === 26) {
                        }
                        let source = edge.source;
                        let target = edge.target;

                        if (childrenIDs.includes((edge.source))) {
                            source = parentID;
                        }

                        if (childrenIDs.includes((edge.target))) {
                            target = parentID;
                        }

                        if (!handler.hasNode(source)) {
                            let currentNode = source;
                            let n = 0;
                            while (!handler.hasNode(currentNode) && n < 10) {
                                currentNode = childParentMap.get(currentNode);
                                n++
                            }
                            source = currentNode

                        }
                        if (!handler.hasNode(target)) {
                            let currentNode = target;
                            let n = 0
                            while (!handler.hasNode(currentNode) && n < 10) {
                                currentNode = childParentMap.get(currentNode);
                                n++;
                            }
                            target = currentNode
                        }

                        handler.addEdge({
                            source: source,
                            target: target,
                            settings: {type: edge.labels, id: edge.id}
                        });
                    })
                })
                handler.render()
            }
        });

    edges
        .on("mousemove", (event, d) => {
            buildInfoBox(d, event);
        })
        .on("mouseout", (event, d) => {
            d3.select(".infoBox").style("display", "none")
        })
        .on("mouseover", () => {
            d3.select(".infoBox").style("display", "block");
        })
}

//Function: isChild
//checks if node has a parent node
//
//Parameters:
//nodeId - id of node
//
//Returns:
//true if node has parent node
function isChild(nodeId) {
    return childParentMap.has(nodeId)
}

//Function: buildInfoBox
//builds and positions DOM element that shows node/edge details according to input values
//
//Parameters:
//elem - element on which an event was triggered, for which info box is generated
//event - an event object used for positioning the info box
function buildInfoBox(elem, event) {

    let openDetails = "open";
    if (!settings.ui.showDetailsOpen) {
        openDetails = '';
    }

    const IDs = elem.attributes.id.split(',')

    if (elem.attributes.class.includes("edge")) {

        const items = []
        IDs.forEach(id => {
            items.push(edgeMap.get((id)))
        })

        let html = ``;
        items.forEach(item => {
            const itemProps = item.properties;
            let name = settings.graph.placeHolderForMissingEdgeName;
            if (itemProps.name === undefined || itemProps.name !== "noname") {
                name = itemProps.name;
            }

            const sourceName = nodeMap.get(item.source).properties.name;
            const targetName = nodeMap.get(item.target).properties.name;
            html += `
      <details ${openDetails} id="edgeInfoBox${item.id}">
        <summary> ${name}
          <div class="edgeDataflow">
            <div class="flowItem">
              ${sourceName}
            </div>

            <div class="arrowElem" style="--bgcolor-var:${settings.ui.infoboxEdgeColors[item.labels]}">
              <span class="arrowText">${item.labels}</span>
            </div>

            <div class="flowItem">
              ${targetName}
            </div>
          </div>
        </summary>` + Object.entries(itemProps).map(row => `<span class="infoItem">${row[0]}:<mark>${row[1]}</mark></span>`).join('') + `  
      </details>`;
        })

        infobox.html(html)
            .transition()
            .duration(200)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
    }

    if (elem.attributes.class.includes("node")) {

        const items = [];
        if (parentChildMap.has((elem.attributes.id)) && nodeMap.get((elem.attributes.id))) {
            items.push(...parentChildMap.get((elem.attributes.id)));
        } else {
            items.push(elem.attributes.id);
        }

        let html = ``;

        items.forEach(itemID => {
            if (nodeMap.has(itemID)) {
                let item = nodeMap.get((itemID));
                const name = item.properties.name;
                if (item.labels.includes("parent")) {
                    html += `<h2>${name}</h2><hr>`
                } else {
                    html += `<details ${openDetails}><summary>${name}</summary>` + Object.entries(item.properties).map(row => `<span class="infoItem">${row[0]}:<mark>${row[1]}</mark></span>`).join('') + `</details>`;
                }
            }
        })

        infobox.html(html)
            .transition()
            .duration(200)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY + 5) + "px");

    }
}

//Function: getColor
//checks if color is assigned for node by attribute and returns that color. If no color is specified, new color is chosen and used for future nodes of same coloring attribute value
//
//Parameters:
//node - node
//
//Returns:
//color to be used for input node
function getColor(node) {
    if (currentColorSet.length === 0) {
        currentColorSet = settings.graph.colorSet.slice();
    }

    let tempNode = node;

    if (tempNode !== undefined && tempNode.hasOwnProperty("properties")) {
        if (node.labels.includes("origin")) {
            tempNode = "origin";
        } else {
            tempNode = node.properties[settings.graph.nodeColoringAttribute];
        }
    }


    if (currentGroupColors.hasOwnProperty(tempNode)) {
        return currentGroupColors[tempNode];
    } else {
        currentGroupColors[tempNode] = currentColorSet[0];
        currentColorSet.shift();
        return currentGroupColors[tempNode];
    }
}

//Function: getImage
//fetches SVG for node
//
//Parameters:
//nodeType - node parameter that specifies symbol to be used
//
//Returns:
//SVG for node
async function getImage(nodeType) {
    return await getSVG(nodeType);

}


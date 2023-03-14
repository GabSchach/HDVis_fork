// Class: DotHandler
class DotHandler {
    // Variable: dotSrc
    // Currently rendered dot language string
    dotSrc;

    // Variable: boilerplate
    // boilerplate for dot string
    boilerplate = ["digraph G{\n", "\n}\n"];

    // Variable: clusters
    // array of clusters currently rendered
    clusters = [];

    // Variable: graphSettings
    // graphviz settings for the graph
    graphSettings = {};

    // Variable: edges
    // array of edges currently rendered
    edges = [];

    // Variable: nodeSettings
    // graphviz settings for nodes
    nodeSettings = {};

    // Variable: edgeSettings
    // graphviz settings for edges
    edgeSettings = {};

    // Variable: nodesIds
    // ids of all nodes over all clusters in dotHandler object
    nodesIds = [];

    // Variable: parentIds
    // ids of all parent nodes over all clusters in dotHandler object
    parentIds = [];

    // Variable: savedImages
    // array of all distinct symbols added to object
    savedImages = [];

    // Variable: eventHandler
    // function that adds interactivity to rendered graph
    eventHandler;

    // Variable: gViz
    // holds access to d3-graphviz API
    gViz;

    // Variable: domAnchor
    // DOM element where visualisation is attached
    domAnchor;

    //Function: constructor
    //
    //Parameters:
    //domElement - DOM element where visualisation is attached
    //eventHandler - function that adds interactivity to rendered graph
    constructor(domElement, eventHandler) {

        this.eventHandler = eventHandler;

        this.domAnchor = domElement

        if (this.gViz === undefined) {
            this.gViz = d3.select(domElement).graphviz().options({fit: true, zoom: true});
        }
        this.gViz._images = [];

        this.gViz.tweenPrecision('90%');

    }

    //Function: getClusterByNode
    // retrieves cluster object that contains node with specified id
    //
    //Parameters:
    //nodeID - id of node
    //
    //Returns:
    //Cluster containing specified node in array, or empty array
    getClusterByNode(nodeID) {
        const cluster = this.clusters.filter(c => {
            return c.nodes.map(n => {
                return n.id;
            }).indexOf((nodeID)) >= 0
        });
        return (cluster);
    }

    //Function: getClusterByName
    //retrieves cluster object with specified name
    //
    //Parameters:
    //name - name of cluster
    //
    //Returns:
    //Cluster with specified name or undefined
    getClusterByName(name) {
        return this.clusters.filter(c => c.name === name)[0];
    }

    //Function: getEdges
    //
    //Returns:
    //Array of all edges in object
    getEdges() {
        return this.edges;
    }

    //Function: getNodeIds
    //
    //Returns:
    //Array of all node IDs over all clusters
    getNodeIds() {
        return this.nodesIds;
    }

    //Function: setGraphSettings
    //graphviz settings for entire graph
    //
    //Parameters:
    //settings - object with settings names and values
    setGraphSettings(settings) {
        for (const key in settings) {
            this.graphSettings[key] = settings[key];
        }
    }

    //Function: setNodeSettings
    //graphviz settings for all nodes
    //
    //Parameters:
    //settings - object with settings names and values
    setNodeSettings(settings) {
        for (const key in settings) {
            this.nodeSettings[key] = settings[key];
        }
    }

    //Function: setEdgeSettings
    //graphviz settings for all edges
    //
    //Parameters:
    //settings - object with settings names and values
    setEdgeSettings(settings) {
        for (const key in settings) {
            this.edgeSettings[key] = settings[key];
        }
    }

    //Function: resetZoom
    //resets all zoom and transitions and centers the visualization
    //
    resetZoom() {
        this.gViz
            .resetZoom(d3.transition().duration(800));
    }

    //Function: render
    // renders graph data currently contained in object
    //
    render() {
        this._updateDotString();
        this.gViz
            .transition(function () {
                return d3.transition()
                    .delay(50)
                    .duration(1000).ease(d3.easeLinear);
            })
            .renderDot(this.dotSrc, () => {
                //use this function to apply changes to graphic directly after rendering
            })
            .width(document.documentElement.clientWidth - 20)
            .height(document.documentElement.clientHeight - 40)
            .on("end", this.eventHandler);

        console.log(this.dotSrc)
    }

    //Function: hasNode
    //checks if graph contains node with specified id
    //
    //Parameters:
    //nodeID - id of node
    //
    //Returns:
    //true if node exists
    hasNode(nodeID) {
        return this.nodesIds.includes(nodeID);
    }

    //Function: setCluster
    //sets array of clusters stores symbol for reuse
    //
    //Parameters:
    //cluster - array of cluster objects
    setCluster(cluster) {

        cluster.nodes.forEach(node => {
            if (node.settings.hasOwnProperty("image")) {

                const image = node.settings.image;
                if (!this.savedImages.includes(image) && node.settings.image !== undefined) {
                    this.gViz.addImage(image, "250px", "200px");
                    this.savedImages.push(image);
                }
            }
            this.nodesIds.push(node.id)
            if (node.parent) {
                this.parentIds.push(node.id)
            }
        })

        this.clusters.push(cluster);
    }

    //Function: removeNode
    //removes node by id
    //
    //Parameters:
    //nodeID - id of node to be deleted
    removeNode(nodeID) {
        const clusters = this.getClusterByNode(nodeID);
        clusters.forEach(cluster => cluster.removeNode(nodeID))
        if ((nodeID) >= 0 && this.nodesIds.indexOf((nodeID)) >= 0) {
            this.nodesIds.splice(this.nodesIds.indexOf((nodeID)), 1);
            if (this.parentIds.includes((nodeID))) {
                this.parentIds.splice(this.parentIds.indexOf((nodeID)), 1);
            }
        }
    }

    //Function: removeEdgeByNode
    //removes all edges that are connected to a node with specified id
    //
    //Parameters:
    //nodeID - id of node
    //
    //Returns:
    //array with ids of removed edges
    removeEdgeByNode(nodeID) {
        const removedEdges = [];
        this.edges = this.edges.filter(e => {
            if (e.source !== (nodeID) && e.target !== (nodeID)) {
                return true;
            }
            removedEdges.push(e.settings.id)
            return false
        })
        return removedEdges
    }

    //Function: addNode
    //adds node to specified cluster
    //
    //Parameters:
    //cluster - name of cluster the node is to be added to
    //node - node to be added
    addNode(cluster, node) {
        cluster = this.getClusterByName(cluster)
        const image = cluster.addNode(node).settings.image;
        if (!this.savedImages.includes(image) && node.settings.image !== undefined) {
            this.gViz.addImage(image, "250px", "200px");
            this.savedImages.push(image);
        }
        this.nodesIds.push(node.id);
        if (node.parent) {
            this.parentIds.push(node.id);
        }
    }

    //Function: changeSymbol
    //changes symbol of existing node
    //
    //Parameters:
    //nodeID - id of node
    //color - new color for node
    //shape - new symbol for node
    changeSymbol(nodeID, color, shape) {
        const clusters = this.getClusterByNode(nodeID);
        let newImage;
        clusters.forEach(cluster => {
            newImage = cluster._changeSymbol(nodeID, color, shape)
        });

        if (newImage) {
            if (!this.savedImages.includes(newImage)) {
                this.gViz.addImage(newImage, "250px", "200px");
                this.savedImages.push(newImage);
            }
        }
        this._updateDotString()
        this.render()
    }

    //Function: resetEdges
    //resets array of edges
    resetEdges() {
        this.edges = [];
    }

    //Function: destruct
    //deletes all data contained in object, removes visualization from DOM, destructs graphviz objects in d3-graphviz/hpcc
    destruct() {
        this.resetEdges()
        this.resetClusters()
        this.graphSettings = {};
        this.nodeSettings = {};
        this.edgeSettings = {};
        this.savedImages = [];
        this.gViz.destroy();
        const domID = this.domAnchor.substring(1)
        let elem = document.getElementById(domID)
        elem = elem.firstChild
        elem.remove();
    }

    //Function: resetClusters
    //resets array of clusters
    resetClusters() {
        this.clusters = [];
        this.nodesIds = [];
        this.parentIds = [];
    }

    //Function: setEdges
    //sets array of edges
    //
    //Parameters:
    //edges - array of edge
    setEdges(edges) {
        this.edges = edges;
    }

    //Function: addEdge
    //adds edge to edge array
    //
    //Parameters:
    //edge - edge to be added
    addEdge(edge) {
        this.edges.push(edge);
    }

    //Function: _getDuplicateEdges
    //returns Map with all edges connecting the same nodes
    //
    //Returns:
    //array with duplicate edges
    _getDuplicateEdges() {


        function getAllIndexes(arr, val) {
            const indexes = [];
            let i;
            for (i = 0; i < arr.length; i++)
                if (arr[i][0] === val)
                    indexes.push(i);
            return indexes;
        }

        let tempEdges = this.edges.map(edge => ['' + edge.source + ',' + edge.target, edge.settings.id]);
        const tempIds = [];
        const allDuplicates = new Map;
        tempEdges.forEach(edge => {
            const duplicates = getAllIndexes(tempEdges, edge[0]);
            if (duplicates.length > 1 && !tempIds.some(p => JSON.stringify(p) === JSON.stringify(duplicates))) {
                tempIds.push(duplicates);
                allDuplicates.set(this.edges[duplicates[0]].settings.id, duplicates.map(id => this.edges[id].settings.id))
            }
        })
        return allDuplicates;

    }

    //Function: _prepareClusterName
    //removes spaces special characters from cluster names (graphviz doesn't like them)
    //
    //Parameters:
    //input - name of cluster as stored in cluster object
    //
    //Returns:
    //sanitizes cluster name for dot language string
    _prepareClusterName(input) {
        if (input === undefined)
            return undefined;
        return input.replace(/[^A-Z0-9]+/ig, "");
    }

    //Function: _updateDotString
    //generates dot language string out of all data contained within object
    _updateDotString() {
        let temp;
        const originIDs = [];
        let gSet = 'graph [ ';
        let nSet = 'node [ ';
        let eSet = 'edge [ ';


        for (const key in this.graphSettings) {
            gSet += key + ' = "' + this.graphSettings[key] + '", ';
        }
        temp = gSet + ' ]\n'

        for (const key in this.nodeSettings) {
            nSet += key + ' = "' + this.nodeSettings[key] + '", ';
        }
        temp += nSet + ' ]\n'

        for (const key in this.edgeSettings) {
            eSet += key + ' = "' + this.edgeSettings[key] + '", ';
        }
        temp += eSet + ' ]\n'

        this.clusters.forEach(cluster => {

            let cString = 'subgraph cluster_' + this._prepareClusterName(cluster.name) + '{\n';

            for (const key in cluster.clusterSetting) {
                cString += key + ' = "' + cluster.clusterSetting[key] + '"\n';
            }

            cString += 'node ['
            for (const key in cluster.nodeSettings) {
                cString += key + ' = "' + cluster.nodeSettings[key] + '", ';
            }

            if (!settings.ui.showDefaultTooltip) {
                cString += `tooltip=" "`;
            }

            cString += ' ];\n'

            let nodeString = '';
            cluster.nodes.forEach(node => {
                if (node.origin) {
                    originIDs.push(node.id);
                }
                nodeString += node.id + " [";

                if (this.parentIds.includes((node.id))) {
                    nodeString += ' class = "parent", '
                }

                for (const key in node.settings) {
                    nodeString += key + ' = "' + node.settings[key] + '", ';

                }

                nodeString += ']\n';
            })

            cString += nodeString;
            cString += "}\n";

            if (cluster.name === undefined) {
                temp += nodeString;
            } else {
                temp += cString;
            }


        })


        const duplicates = this._getDuplicateEdges();

        const edgesToSkip = [];

        this.edges.forEach(edge => {
            if (!edgesToSkip.includes(edge.settings.id)) {
                temp += edge.source + ' -> ' + edge.target + ' [';
                for (const key in edge.settings) {
                    if (key === "id") {
                        if (duplicates.has(edge.settings[key])) {
                            temp += key + ' ="' + duplicates.get(edge.settings[key]) + '", '
                            edgesToSkip.push(...duplicates.get(edge.settings[key]));

                        } else {
                            temp += key + ' = "' + edge.settings[key] + '", ';
                        }

                    }
                    if (key === "type" && edge.settings[key] === "conditional") {
                        temp += 'style="dashed"';

                    } else if (key !== "id" && key !== "type") {

                        temp += key + ' = "' + edge.settings[key] + '", ';
                    }
                }
                if (!settings.ui.showDefaultTooltip) {
                    temp += `tooltip=" "`;
                }

                temp += ' ];\n';
            }
        })

        originIDs.forEach(originID => {
            temp += "{rank=source; " + originID + "}\n";
        })

        this.dotSrc = this.boilerplate[0] + temp + this.boilerplate[1];
    }
}

// Class: Cluster
class Cluster {
    // Variable: name
    // cluster name
    name;
    // Variable: clusterSetting
    // object containing all cluster settings
    clusterSetting = {};
    // Variable: nodeSettings
    // object containing all node settings
    nodeSettings = {};
    // Variable: nodes
    // array of nodes in cluster
    nodes = [];

    //Function: constructor
    //Parameters:
    //name - name of new cluster
    constructor(name) {
        this.name = name;
    }

    //Function: setNodeSettings
    //sets settings for nodes in cluster
    //
    //Parameters:
    //settings - object with settings names and values
    setNodeSettings(settings) {
        for (const key in settings) {
            this.nodeSettings[key] = settings[key];
        }
    }

    //Function: setClusterSettings
    //sets settings for cluster
    //
    //Parameters:
    //settings - object with settings names and values
    setClusterSettings(settings) {
        for (const key in settings) {
            this.clusterSetting[key] = settings[key];
        }
    }

    //Function: removeNode
    //removes node by id
    //
    //Parameters:
    //nodeID - id of node
    removeNode(nodeID) {
        const index = this.nodes.map(e => e.id).indexOf((nodeID));
        if (index >= 0) {
            this.nodes.splice(index, 1);
        }
    }

    //Function: _changeSymbol
    //changes symbol of existing node
    //
    //Parameters:
    //nodeID - id of node
    //color - new color for node
    //shape - new symbol for node
    //
    //Returns:
    //new symbol
    _changeSymbol(nodeID, color, shape) {
        const index = this.nodes.map(e => e.id).indexOf((nodeID));

        if (index >= 0) {
            this.nodes[index].settings.nodeColor = color;
            this.nodes[index].settings.image = shape;
            this.nodes[index] = this._addSymbol(this.nodes[index]);
            return this.nodes[index].settings.image;
        }
    }

    //Function: hasNode
    //checks if cluster contains node with specified id
    //
    //Parameters:
    //nodeID - id of node
    //
    //Returns:
    //true if node with specified id is contained in cluster
    hasNode(nodeID) {
        return this.nodes.map(e => e.id).indexOf(nodeID) !== -1;
    }

    //Function: _addSymbol
    //checks if symbol is graphviz native, custom or none and applies settings
    //
    //Parameters:
    //node - new node
    //
    //Returns:
    //node with graphviz usable image
    _addSymbol(node) {
        if (node.settings.image !== undefined) {
            let symbolOld = node.settings.image;

            let symbolNew;

            symbolNew = symbolOld.trim().replaceAll('fill="none"', '');

            symbolNew = symbolNew.replace('svg', 'svg fill="' + node.settings.nodeColor + '"')
            node.settings.image = "data:image/svg+xml;base64," + btoa(symbolNew);


        } else if (!node.settings.hasOwnProperty("shape")) {
            node.settings.shape = settings.graph.defaultShape;
            node.settings.color = "black";
            node.settings.fillcolor = settings.graph.defaultShapeColor;
            node.settings.style = "filled";
            node.settings.fixedsize = "true";
            node.settings.width = 250 / 180;
            node.settings.height = 200 / 180;
        }
        return node;
    }

    //Function: addNode
    //adds new node to cluster
    //
    //Parameters:
    //node - node to be added
    //
    //Returns:
    //new node
    addNode(node) {

        this.nodes.push(this._addSymbol(node));
        return node;
    }

    //Function: setNodes
    //adds array of nodes to cluster
    //
    //Parameters:
    //nodes - array of nodes
    setNodes(nodes) {
        nodes.forEach(node => {
            this.addNode(node);
        });

    }

}


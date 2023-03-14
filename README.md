# Documentation

[toc]





## Getting started

Start by cloning this repository or downloading the code as .zip.

### neo4j

Follow the instructions on [neo4j.com](neo4j.com) to install and start a new databse.
Alternatively you can load a database from a database dump file, by adding the `.dump` file to a neo4j project and then selecting  `create new DBMS from dump` in the options of added the `.dump` file.

### Backend

Before running the backend, database connection info has to be added in the `application.properties` file.  

* `neo4j.uri` : consists of IP:Port, the port can be found in the settings file of the desired neo4j database under  `server.bolt.advertised_address`
* `neo4j.authentication.username`: default is `neo4j` unless changed by the user
* `neo4j.authentication.password`: is set by the user upon neo4j database creation 

To run the aüülication several things are required:

* installation of maven
* JDK 17 or higher

The application can then be started by running the `mvn spring-boot:run` command in the backend folder

### Web

In `settings.js` set the address of the spring-boot backend.
To run locally, the files simply have to be made available by a server. This can be done simply via opening the folder in WebStorm or running the command `python -m http.server` in the folder. 


## Web application

### Overview

#### script.js

* contains many general and viewer specific functions
* stores global variables
* application initialization function `init()`

#### viewers.js

* contains functions for rendering different visualizations (scenario view, ...)

#### UIElements.js

* UI initialization function
* UI reset function
* all UI elements contained in menu bar are managed here

#### settings.js

* all relevant settings ranging from node colour to database address

#### dotHandler.js

* maintains state of current visualization
* transforms data into input string for graphViz
* all changes to visualization should be done through DotHandler instance

#### databaseService.js

* communication with the backend
* fetched images
* fetched nodes, edges, node hierarchies

#### index.html

* basic HTML file containing anchors used by the application

#### libraries

* d3-graphViz: On the basis of hcpp-js/wasm which contains a webAssembly ported version of the graphViz C++ library, d3-graphViz generates a visualization of the input data. This is then rendered to the DOM with the help of d3.js.
* d3.js: used to animate transitions and handle node/edge data. 

### UI

Buttons on the top of the page offfer several options for interacting with the graph and the information contained within. Several buttons offer interactivity to the user. All related functions are in UIElements.js. Further elements should also be added here. Below is an example of a button that changes the color and symbol of a node. The anchor is the element to which the new interactive element will be attached. This can be either `menuLeft` or `menuRight` to position it left or to the right.

```javascript
const anchor = document.getElementById("menuLeft");
```

A new button is created and an onclick event added to it. This calls the changeColor function is the DotHandler object and changes the symbol of the node with the id 5 to a blue database symbol.

```javascript
const button = document.createElement("button");
button.textContent = 'change symbol'
button.onclick = function () {
    handler.changeSymbol("5", 'blue', await getSVG("database"));
}
```

Finally the button is added to the page.

```javascript
anchor.appendChild(button);
```

UI elements can be view specific, so when instaniating on all interactive elements that are to be displayed have to be specified by calling `setUI`. That is provided with an array containing the functions responsible for adding the specified elements.

```javascript
setUI([changeNodeSymbol]),
```



### Views

Currently two visualizations are implemented. The inital overview of scenrios and the detailed scenario view. 

#### Adding a new viewer

To implement a new view, at first a new `DotHandler` object has to be instanitated and assigned to the global variable `handler`.  The first argument is the DOM element to which the visualization is attatched. The second argument is an [event handler](#event-handler), that attatched events to specified DOM elements once rendering is completed. 

```javascript
handler = new DotHandler("#graph", eventHandler);
```

Graph data has to be provided to the DotHandler. For specific requirements see [handling graphviz](#handling-graphviz). After that the graph can be rendered with

```javascript
handler.render();
```

Interactive elements need to be specified by calling `setUI(...)`, for details see [UI section](#UI)

#### Event handler

The idea behind the event handler function here is that it is called after the graph is rendered and adds event listeners to the elements of the visualization (nodes, edges,...) with the help of d3.js

````javascript
function eventHandler(){
    let nodes = d3.selectAll('.node');
    nodes.on("click", (event)=>event.target.style.opacity="0.5" )
}
````

 The example sets nodes to half opacity upon click.

#### Changing viewer

When switching to a different viewer the current one has to be deleted. By calling `resetViewer()`, then a different one can be initialized, like the scenario overview below. Additionally it makes sense to remove all UI buttons from the top of the page if different interactivity is desired for the new viewer. 

```javascript
resetViewer();
removeUIElements(); //optional
overviewViewer();
```

### Preparing the visualization

All graphviz related work is done in a DotHandler object. It takes graph data and settings, transforms them into a dot language string and passes them on to d3-graphviz for further processing. Below we will look a various examples of how we transform the data fetched from the backend into graphviz compatible data.For a successfull render with nodes and edges the following variables have to be set:

* graph settings
* node settings
* edge settings
* edges
* clusters: Array of cluster objects
  * cluster settings
  * node settings
  * nodes

#### Settings

Settings can be applied on graph, cluster or node basis, with node level settings taking priority over cluster settings and cluster settings over graph settings. These are set in the form of a javascript object. For options see the description of the settings file [below](#settings-file).

```javascript
	  {
            rankdir: 'LR',
            fontname: 'Helvetica,Arial,sans-serif',
            bgcolor: '#262626'
        }
```

#### Edges

Edges exist independently from clusters and are directly passed to the handler like below. Each edge must contain the id of a `source` and `target` node. It must also have a `type` and it's own `id`. 

```javascript
handler.addEdge({
	source: 1,
	target: 2,
	settings:{type: "transfers", id:5}
})
```

Note: This is only the representation of an edge within a dotHandler object. 

Edges can be removed via their nodes:

```javascript
removeEdgebyNode(nodeID)
```

This function removes all edges that have `nodeID` as either source or target. Several edges with the same source and target nodes will be bundeled into one by the DotHandler instance.

#### Clusters

Clusters are groups of nodes which are layed out in close proximity. Every node in the graph is contained within a cluster according to the nodes `groupingVariable`. If the node does not have this attribute, it is added to the `undefined` cluster. This cluster is not rendered and the nodes within are rendered cluster independent.

When creating a cluster, the cluster and node settings should be set as describes above. Nodes are then added as described in [nodes](#nodes). After these steps a cluster can be added to the dotHandler object. Below is an example of the whole process.

```javascript
const cl = new Cluster();
cl.setClusterSettings({color: '#262626'});
cl.setNodes(arrayOfNodes);
handler.setCluster;
```

#### Nodes

Nodes are usually added to a Cluster as seen above in an array or individually. They can also be added directly to the handler. In this case the handler passes the node to a cluster, the name of which also has to be passed. Below is an example

```javascript
handler.addNode(clusterName, {
                            id: 1,
                            type: "database",
                            parent: true,
                            origin: false,
                            settings: {
                                id: 1,
                                label: "name",
                                image: SVG,
                                nodeColor: blue
                            }
                        });
```

Note: This is only the representation of a node within a dotHandler object. 
This example above is quite simple, below we will now look at  a more complex example:

```javascript
handler.addNode(node.properties[settings.graph.groupingVariable], {
                            id: node.id,
                            type: node.labels[0],
                            parent: node.labels.includes("parent"),
                            origin: node.labels.includes("origin"),
                            settings: {
                                id: node.id,
                                label: node.properties.name,
                                image: await getImage(node.labels[0]),
                                nodeColor: getColor(node)
                            }
                        });
```

The first parameter, the cluster name, is derived from the nodes 'groupingVariable'. Nodes have an array of labels, the first of which defines the type. After that are optionally other labels, like `origin`.  The image is also defined by the type/ first label and loaded from the backend. The node color is defined by the `nodeColoringAttribute` attribute and preset `groupColors`.



### Backend connection

The address to exchange data witch the backend is stored in `settings.js` as specified [below](#Settings-file). All functions that fetch data from the backend are in the `databseService.js`. Relationship data is also transformed here into arrays of edges and nodes, that can be used by d3.js. 



### Settings file

* graph: general settings for graphs
  * placeHolderForMissingEdgeName: placeholder, when node/edge has no name attribute
  * defaultShape: shape out of the graphViz included shapes, used when no symbol is available
  * defaultShapeColor: color for the default shape
  * colorConsistency: see [Colors](#Colors)
  * groupingVariable: node attribute by which the nodes are clustered
  * nodeColoringAttribute: node attribute by which the nodes are coloured
  * colorSet: d3 colour set for setting node colours when not in ``GroupColors `below

* ui
  * infoboxEdgeColors: different edge type are colour coded in info box, for each type a colour must be set
  * showDetailsOpen: whether <Details> element in infobox should be open by default
  * showDefaultTooltip: whether node id, edge id cluster id is shown upon hover

* overviewNeatoSettings: settings used for the scenario overview
  * graphSettings: see Graphviz documentation for [graph attributes](https://graphviz.org/docs/graph/)
  * nodeSettings: see Graphviz documentation for [node attributes](https://graphviz.org/docs/nodes/)
  * edgeSettings: see Graphviz documentation for [edge attributes](https://graphviz.org/docs/edges/)

* scenarioDotSettings: settings used for the scenario view
  * graphSettings: see Graphviz documentation for [graph attributes](https://graphviz.org/docs/graph/)
  * nodeSettings: see Graphviz documentation for [node attributes](https://graphviz.org/docs/nodes/)
  * edgeSettings: see Graphviz documentation for [edge attributes](https://graphviz.org/docs/edges/)

* groupColors: preset colors used for nodes/clusters with corresponding `nodeColoringAttribute` value 
* database
  * springURI: address used to communicate with backend



### Important considerations

### Colors

Node colors can be set ind the `groupColors` variable, left undefined or both. If a node has a specified color it will be used, if not a color from the ``colorSet` will be used. This color will then be reused for all nodes with the same `nodeColoringAttribute`(e.g. institution). When changing scenario view color attribution may remain consistent, when viewing many different scenarios however all colors will be allocated at some point however, at which point colors will start to get reused. To try and prevent this, `colorConsistency` can be set to false. This means tha automatically assigned colors will be reused when switching view. This lowers the risk of colors being reused within a visualization, but does mean that nodes of the same type might have different colors in different visualizations.

#### IDs

Node and edge IDs are treated as Strings because of neo4j might be deprecating numeric IDs.

#### Symbols / images

The SVGs used for node visualizations are fetched from the backend. All SVGs have a width to height ratio of 1,25:1. This ratio is also reflects in the DotHandler class where the symbols are added as 250px to 200px sized images. The size and ratio can obviously be changes, but to prevent distortions. SVG width-height ratio needs to be the same as used in `DotHandler`.
Further requirements new SVGs must meet:

* explicit declaration of width and size
* `fill` attribute must be `none`



## Backend

The spring-boot application is used to abstract database access and can be used to query and create database entries. The database access is handeled using the `neo4j-driver`.  The endpoints are divided into `NodeEndpoint`, `RekationShipEndpoint`, `ScenarioEndpoint`.

* NodeEndpoint: this endpoint is used to query nodes or node hierarchies. 
* RelationshipEndpoint: used to query and add RelationshipObject objects
* ScenarioEndpoint: used to query relationships by scenario

### NodeObject

Node objects consist of the following object variables:

* identidy: a String that stores the automatically generated database id
* labels: a list containing all the nodes labels (database, origin,...)
* props: a Map containing property names and respective property values

### RelationshipObject

Relationship objects store directed relationships between two nodes and contain the following:

* identidy: a String that stores the automatically generated database id for the relationship
* labels: the label of the relations
* props: a Map containing property names and respective property values
* source: the node where the edge originates
* target: the node the edge points at



### Adding request mappings

For new endpoints and mappings it is usefull to look at [online spring resources](https://www.baeldung.com/spring-requestmapping). A `GetMapping` with a `@PathVariale` called `nodeName` defining the name attribute of a queried node can then look like this.

The variable is put in a map to be used by the query later.

```java
Map<String, Object> params = new HashMap<>();
params.put("nodeName", nodeName);
```

A session is started using the driver instantiated in the endpoint constructor.

```java
Session session = driver.session();
```

The query is then run using prepared statements to prevent cypher injectiont (same scenario as with SQL injections). The return value is then stored as a `Result` object. 

```java
Result result = session.run("Match (p) where p.name = $nodeName  return (p)", params);
```

By calling `result.hasNext()` we verify that the query returned with result data before continuing. If the query could only return with max. one result, `result.single()` can be used to get the `Record` object containing the query result, that can then be used as a `Node` object. To retrieve data from the record it is important to use the identifiers defined in the query. Below we use `rec.get("p")` because the return value was called "p" in the query above. The Node properties are then used to instantiate a `NodeObject` object, defined in the `entity` package and is then returned to the client.

```java
  if (result.hasNext()) {
            Record rec = result.single();
            Node node = rec.get("p").asNode();
            String elemId = node.elementId().split(":")[2];
            List<String> labels = new ArrayList<>();
            node.labels().forEach(labels::add);
            Map<String, Object> properties = node.asMap();

            NodeObject nodeObject = new NodeObject();
            nodeObject.setIdentity(elemId);
            nodeObject.setLabels(labels);
            nodeObject.setProps(properties);

            return nodeObject;
        }
```



### Adding nodes

To add a node to the database the `node` endpoint is used to post a `NodeObject`.  The endpoint retuns the newly created database entry inluding id.

```java
http://.../node
```

The new node must contain an array with at least one label and a `props` attribute with a name. Other values in the form of Strings, numbers or arrays can also be added to `props`. When a `name` reaches about 12 characters it also makes sense to introduce `nameShort` to define an abbreviated name that will be used in the visualization. When adding a new with a new `label` it has to be added to the `TypeLabels` or `FunctionalLabel` enum depending on whether the label potins to a symbol or the node's relationship to other nodes.

```json
 {   
            "labels": [
                "event",
                "test"
            ],
            "props": {
                "name": "nodeName",
                "nameShort": "example",
                "details":"important information"
            }
        
    }
```

#### Node properties

All mandatory and suggested `props` vairables include:

*  name: **unique** mandatory node attribute; used in visualization *(mandatory)*
*  nameShort: short name; used in visualization
*  institution: where the node belongs to; used in visualization
*  details: string containing information about the node; used in visualization 
*  decisionBasis: the basis of a decision in a decision node

#### Node labels

Node labels must be in the `labelsEnum`, additionally labels that will be used to determine the symbol used for te visualization should have an SVG with the same name in the images folder. Other labels currently in use are:

* symbol names: database, pocess...
* origin: signifies the origin of a scenario, most likely an event
* parent: every node that is the source of an `includes` relationship must have this label



### Ndding relationships

To add a new relationship or edge, first two nodes are needed that will be used as source and target. To add a node see [adding nodes](#adding-nodes). New relationships are added using the relationship endpoint. The endpoint retuns the newly created database entry inluding id.

```java
http://.../relationship
```

A relationship must contain at least a `label`,  a `name` and a `scenario`.  Source and target node need to adhere to the definition of `NodeObject` but dont need all variables being set. To establish the relationship in the database the node ids are used, if they are not present in both nodes, the name attribute is used. 

```java
 {
        "labels": "test",
        "props": {
            "name": "name",
            "scenario": [
                "TestSzenario"
            ]
        },
        "source": {
            "identity":"65",
            "props": {
                "name": "nameSource"
            }
        },
        "target": {
            "identity":"66",
            "props": {
                "name": "nameTarget"
            }
        }
    }
```

#### Relationship properties

All mandatory and suggested `props` vairables include:

* name: name of the relationship *(mandatory)*
* scenario: array containing all scenarios this relationship is included in *(mandatory)*
* content: an array of all transfered data
* details: string with additional information
* legalBasis: reference to laws describing relationship

Hierarchies can be dependent on scenario, therefore even `includes` relationships need to have the scenario set

#### Relationship labels

There are currently four different labels in use, only one can be choosen per edge:

* transfers: describes data being transfered from source to target node
* conditional: edges originating from a `decision` type node, that signify that transfer is not guaranteed
* produces: edges that point to an element in the dataflow but an element that gets produced by a node (document, map, ...)
* includes: not used in visualization; signifies that source is the parent node of the targe node. 

#### Relationship nodes

* source: source node; must include `id` or `name`
* target: source node; must include `id` or `name`



### Important considerations

#### IDs

Nodes have IDs, the id() method has however been deprecated

#### parent relationships

Every node can only have one parent. 

#### node names

Node names must be unique, if different nodes need to be visualized with the same name, the `nameShort` property can be used.

### Dependencies

* lombok: to reduce boilerplate code
* neo4j-driver: used to access database
* javadoc: run `mvn javadoc:javadoc` to generate javadoc html page



## neo4j

The neo4j database can be started through the desktop application. The running database privides a port for the `bolt` protocol that is used by the backend. Alterntively to interacting with the database via the backend. It can be accessed locally via through the neo4j browser in the neo4j dektop application. It is also accessible through the web browser via a HTTP Port, which can be found in the database settings. 

For querying the graph database the cypher query language is used, below is short example, for further explanations see the [offficial guide](https://neo4j.com/docs/getting-started/current/cypher-intro/)

```cypher
// Query returns all Person nodes that like technology nodes
MATCH (p:Person)-[:LIKES]->(t:Technology) RETURN p
```



## //todo

A few QoL and functionallity improvements for future work include:

* endpoints for updating nodes/edges

* once a set of all possible labels and attributes is finalized a switch to spring-neo4j would make sense, despite offering less flexibility it provides powerfull database access functionality that is not easily possible with only the neo4j java driver.

  


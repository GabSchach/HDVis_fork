//Function: overviewViewer
//initialized visualization that shows scenario overview
async function overviewViewer() {

    const scenarios = await getScenariosSpring();
    handler = new DotHandler("#graph", neatoInteractionHandler);

    setNeatoSettings();
    let cl = new Cluster()
    const nodes = [];
    nodes.push({
        id: 0,
        type: "person",
        settings: {
            shape: "circle",
            id: "center",
            label: "",
            image: await getImage("person"),
            color: "#AAAAAA"

        }
    })
    const edges = [];
    let idPlaceholder = 1;
    nodeMap = new Map();
    scenarios.forEach(sc => {
        nodeMap.set(sc, sc);
        nodes.push({
            id: sc,
            type: "origin",
            settings: {
                shape: "circle",
                id: sc,
                label: sc,
                color: getColor("origin")
            }
        });
        edges.push({
            source: 0,
            target: sc,
            settings: {id: sc}
        });
        idPlaceholder++;
    });
    cl.setClusterSettings({color: '#262626'})
    cl.setNodes(nodes);
    handler.setEdges(edges);
    handler.setCluster(cl);
    handler.render();


}

//Function: scenarioViewer
//initialized visualization that shows specific scenario
function scenarioViewer(scenario) {

    setUI([showAll, backToOverview, legend, filterEdgesByContent]);

    getAllByScenario(scenario).then(data => {
        edgeData = data.edges.map(d => (d));

        nodeData = data.nodes.map(d => (d));

        nodeData.sort((a, b) => {
            return a.properties[settings.graph.groupingVariable] < b.properties[settings.graph.groupingVariable];
        });

        nodeMap = new Map(nodeData.map((elem) => [elem.id, elem]));
        edgeMap = new Map(edgeData.map((elem) => [elem.id, elem]));

        handler = new DotHandler("#graph", interactionHandler);
        setDotSettings();
        setScenarioData(scenario).then(() => handler.render());

    })

}
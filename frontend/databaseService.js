// Variable: springUri
// address of spring backend as stored in settings.js
const springUri = settings.database.springURI;

//Function: getAllByScenario
// fetches all data based on specified scenario
//
//Parameters:
//scenario - scenario by which database is queried
//
//Returns:
//graph data as edges and node
function getAllByScenario(scenario) {
    return fetch(springUri + '/scenario/?name=' + scenario).then(async response => {
        return scenarioToD3(await response.json());
    });
}

//Function: scenarioToD3
// transforms data for scenario from backend into arrays of nodes and edges
//
//Parameters:
//data - array of relationship data from backend
//
//Returns:
// arrays of nodes and edges
function scenarioToD3(data) {
    const nodes = [];
    const nodeIds = [];
    const edges = [];

    data.forEach(rel => {
        edges.push({
            "id": (rel.identity),
            "labels": rel.labels,
            "properties": rel.props,
            "source": (rel.source.identity),
            "target": (rel.target.identity)
        })

        if (!nodeIds.includes((rel.source.identity))) {
            nodes.push({
                "id": (rel.source.identity),
                "labels": rel.source.labels,
                "properties": rel.source.props
            });
            nodeIds.push((rel.source.identity));
        }

        if (!nodeIds.includes((rel.target.identity))) {
            nodes.push({
                "id": (rel.target.identity),
                "labels": rel.target.labels,
                "properties": rel.target.props
            });
            nodeIds.push((rel.target.identity));
        }

    })


    return {"nodes": nodes, "edges": edges};


}

//Function: getScenariosSpring
// fetched all distinct scenario names from backend
//
//Returns:
//array of scenario names
function getScenariosSpring() {
    return fetch(springUri + '/scenario/all').then(response => {
        return response.json();
    });
}

//Function: getHierarchyByChildren
// fetched node ids with their respective parent nodes by scenario
//
//Parameters:
//scenario - scenario name
//
//Returns:
//object with child node ids and direct parent node ids as attribute values
function getHierarchyByChildren(scenario) {
    return fetch(springUri + '/node/hierarchies/byChildren/?scenario='+scenario).then(response => {
        return response.json();
    })
}

//todo also use scenario??
//Function: getAllChildrenSpring
// fetched all child ids of specified node
//
//Parameters:
//nodeID - id of node
//
//Returns:
//array of node ids
function getAllChildrenSpring(nodeID) {
    return fetch(springUri + '/node/' + nodeID + '/children').then(response => {
        return response.json();
    })
}

//Function: getHierarchyByParents
// fetches parent nodes ids with all direct/ indirect child ids by scenario
//
//Parameters:
//scenario - scenario name
//
//Returns:
//object with parent ids with arrays of child ids
function getHierarchyByParents(scenario){
    return fetch(springUri + '/node/hierarchies/byParent/?scenario=' + scenario).then(response => {
        return response.json();
    })
}

//Function: getSVG
// fetched SVG by name
//
//Parameters:
//name - name of desired SVG
//
//Returns:
//SVG
function getSVG(name) {
    return fetch(springUri + '/symbol/' + name + '.svg')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
        })
        .then(str => {
            return str
        })
        .catch(error => console.error("error occurred fetching image", error));
}

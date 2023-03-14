package backend.endpoint;

import backend.entity.NodeObject;
import backend.entity.RelationshipObject;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Endpoint for all scenario related queries
 */
@RestController
@RequestMapping("/scenario")
@Slf4j
public class ScenarioEndpoint {

    Driver driver;

    /**
     * constructor for ScenarioEndpoint initializes the neo4j driver with database address and credentials
     *
     * @param env Environment object for accessing application.properties values
     */
    @Autowired
    public ScenarioEndpoint(Environment env) {

        driver = GraphDatabase.driver(env.getProperty("neo4j.uri"),
                AuthTokens.basic(env.getProperty("neo4j.authentication.username"),
                        env.getProperty("neo4j.authentication.password")));
    }

    /**
     * get all distinct scenario names
     *
     * @return stream of scenario names
     */
    @GetMapping(value = {"/all"})
    public Stream<String> getScenarioNames() {
        log.info("retrieving all scenario names");
        Session session = driver.session();
        List<String> scenarios = new ArrayList<>();
        Result result = session.run("MATCH ()-[r]->() UNWIND r.scenario as scenario RETURN DISTINCT scenario");

        while (result.hasNext()) {
            Record rec = result.next();
            scenarios.add(rec.get("scenario").asString());
        }
        return scenarios.stream();
    }

    /**
     * get all relationships where scenario attribute includes given scenario name
     *
     * @param name of the desired scenario
     * @return all relationships from scenario
     */
    @GetMapping(value = {"/"})
    public Stream<RelationshipObject> getAllByScenario(@RequestParam String name) {
        log.info("retrieving scenario with name:  {}", name);
        Map<String, Object> params = new HashMap<>();
        params.put("scenario", name);

        Session session = driver.session();
        Result result = session.run("MATCH (p)-[r]->(q) where $scenario in r.scenario RETURN p,r,q", params);

        List<RelationshipObject> relationshipList = new ArrayList<>();

        while (result.hasNext()) {
            Record rec = result.next();

            Node source = rec.get("p").asNode();
            Node target = rec.get("q").asNode();
            Relationship edge = rec.get("r").asRelationship();

            List<String> sourceLabels = orderLabels(source.labels());
            NodeObject sourceObj = new NodeObject(source.elementId().split(":")[2], sourceLabels, source.asMap());

            List<String> targetLabels = orderLabels(target.labels());
            NodeObject targetObj = new NodeObject(target.elementId().split(":")[2], targetLabels, target.asMap());

            //edges only have one label????
            String edgeLabels = edge.type();
            RelationshipObject relationship = new RelationshipObject(edge.elementId().split(":")[2], edgeLabels, edge.asMap(), sourceObj, targetObj);
            relationshipList.add(relationship);

        }

        return relationshipList.stream();
    }

    /**
     * orders node labels, so that the symbol defining label is first in list
     *
     * @param labels iterable containing a set of label strings
     * @return ordered ArrayList containing label strings
     */
    private List<String> orderLabels(Iterable<String> labels) {
        List<String> orderedLabels = new ArrayList<>();
        EnumSet<NodeObject.TypeLabels> typeLabels = EnumSet.allOf(NodeObject.TypeLabels.class);

        labels.forEach((label) -> {
            if(typeLabels.contains(label)){
                orderedLabels.add(0,label);
            }else{
                orderedLabels.add(label);
            }
        });

        return orderedLabels;

    }

}

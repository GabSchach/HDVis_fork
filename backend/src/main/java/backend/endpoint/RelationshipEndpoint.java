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
import org.neo4j.driver.summary.ResultSummary;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.neo4j.driver.Values.parameters;

/**
 * Endpoint for adding and deleting relationships
 */
@RestController
@RequestMapping("/relationship")
@Slf4j
public class RelationshipEndpoint {

    Driver driver;


    /**
     * constructor for RelationshipEndpoint initializes the neo4j driver with database address and credentials
     *
     * @param env Environment object for accessing application.properties values
     */
    @Autowired
    public RelationshipEndpoint(Environment env) {
        driver = GraphDatabase.driver(env.getProperty("neo4j.uri"),
                AuthTokens.basic(env.getProperty("neo4j.authentication.username"),
                        env.getProperty("neo4j.authentication.password")));
    }

    /**
     * add new relationship to database
     *
     * @param relationShip to be added
     * @return newly created relationship including ID
     */
    @PostMapping(value = "")
    public RelationshipObject addRelationship(@RequestBody RelationshipObject relationShip) {


        Session session = driver.session();
        Result result = null;
        if (relationShip.getLabels() == null || relationShip.getLabels().isEmpty()) {
            log.warn("relationship contains invalid label");
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (relationShip.getSource().getIdentity() != null && relationShip.getTarget().getIdentity() != null) {
            int source;
            int target;
            try {
                source = Integer.parseInt(relationShip.getSource().getIdentity());
                target = Integer.parseInt(relationShip.getTarget().getIdentity());
            } catch (NumberFormatException e) {
                log.warn("relationship contains invalid node IDs");
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
            }
            log.info("adding relationship by identity");

            result = session.run("Match(s) Match(t) " +
                    "WHERE ID(s)= $source " +
                    "AND ID(t)=  $target " +
                    "CREATE (s)-[r:" + validatedLabel(relationShip.getLabels()) + " $props ]->(t) return s,r,t", parameters("source", source, "target", target, "props", relationShip.getProps()));


        } else if (relationShip.getSource().getProps().containsKey("name") && relationShip.getSource().getProps().get("name") != null && relationShip.getTarget().getProps().containsKey("name") && relationShip.getTarget().getProps().get("name") != null) {
            log.info("adding relationship by name");

            result = session.run("Match(s) Match(t) " +
                    "WHERE s.name=$source " +
                    "AND t.name= $target " +
                    "CREATE (s)-[r:" + validatedLabel(relationShip.getLabels()) + " $props ]->(t)  return s,r,t", parameters("source", relationShip.getSource().getProps().get("name"), "target", relationShip.getTarget().getProps().get("name"), "props", relationShip.getProps()));


        }

        if (result.hasNext()) {
            Record newRelation = result.next();

            Node sourceNode = newRelation.get("s").asNode();
            Node targetNode = newRelation.get("t").asNode();
            Relationship edge = newRelation.get("r").asRelationship();

            List<String> sourceLabels = new ArrayList<>();
            sourceNode.labels().forEach(sourceLabels::add);
            NodeObject sourceObj = new NodeObject(sourceNode.elementId().split(":")[2], sourceLabels, sourceNode.asMap());

            List<String> targetLabels = new ArrayList<>();
            targetNode.labels().forEach(targetLabels::add);
            NodeObject targetObj = new NodeObject(targetNode.elementId().split(":")[2], targetLabels, targetNode.asMap());

            //edges only have one label????
            String edgeLabels = edge.type();
            session.close();
            return new RelationshipObject(edge.elementId().split(":")[2], edgeLabels, edge.asMap(), sourceObj, targetObj);
        } else {
            ResultSummary summary = result.consume();
            log.warn("database returned empty result for query: " + summary.query().toString());
        }

        log.warn("failed to add relationship to database");
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);

    }

    /**
     * validates label for new relationship
     *
     * @param label string as received by client
     * @return validated label from enum
     */
    private String validatedLabel(String label) {
        try {
            return String.valueOf(RelationshipObject.RelationshipLabels.valueOf(label));
        } catch (IllegalArgumentException ignored) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

}

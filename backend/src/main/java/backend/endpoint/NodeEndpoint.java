package backend.endpoint;

import backend.entity.NodeObject;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.neo4j.driver.Values.parameters;

/**
 * Endpoint for all node related queries
 */
@RestController
@RequestMapping("/node")
@Slf4j
public class NodeEndpoint {

    Driver driver;

    /**
     * constructor for NodeEndpoint initializes the neo4j driver with database address and credentials
     *
     * @param env Environment object for accessing application.properties values
     */
    @Autowired
    public NodeEndpoint(Environment env) {

        driver = GraphDatabase.driver(env.getProperty("neo4j.uri"),
                AuthTokens.basic(env.getProperty("neo4j.authentication.username"),
                        env.getProperty("neo4j.authentication.password")));
    }

    /**
     * get one node by identity
     *
     * @param identity of the desired node
     * @return node with given identity
     */
    @GetMapping(value = "/{identity}")
    public NodeObject nodeById(@PathVariable int identity) {
        log.info("retrieving node with identity:  {}", identity);
        Map<String, Object> params = new HashMap<>();
        params.put("identity", identity);

        Session session = driver.session();

        Result result = session.run("Match (p) where ID(p) = $identity  return (p)", params);

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
        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    /**
     * get all nodes
     *
     * @return all nodes in the database
     */
    @GetMapping(value = {"/all"})
    public Stream<NodeObject> allNodes() {
        log.info("retrieving all nodes");
        List<NodeObject> nodes = new ArrayList<>();

        Session session = driver.session();
        Result result = session.run("MATCH (n) RETURN n");

        while (result.hasNext()) {
            Record rec = result.next();
            Node node = rec.get("n").asNode();
            String identity = node.elementId().split(":")[2];
            List<String> labels = new ArrayList<>();
            node.labels().forEach(labels::add);
            Map<String, Object> properties = node.asMap();

            NodeObject nodeObject = new NodeObject(identity, labels, properties);

            nodes.add(nodeObject);

        }

        return nodes.stream();
    }

    /**
     * get all child to parent hierarchies
     *
     * @return all child node identities with their direct parent node
     */
    @GetMapping(value = {"/hierarchies/byChildren"})
    public Map<String, String> getAllChildParentHierarchies() {
        log.info("retrieving all child identities and parents");

        Session session = driver.session();
        Result result = session.run("Match (p)-[r:includes]->(c) return ID(c),ID(p)");

        Map<String, String> parentMap = new HashMap<>();
        while (result.hasNext()) {
            Record record = result.next();
            parentMap.put(record.get("ID(c)").toString(), record.get("ID(p)").toString());
        }

        return parentMap;
    }

    /**
     * get all child to parent hierarchies that appear in the given scenario
     *
     * @param scenario specifying the desired hierarchy subset
     * @return all child node identities with their direct parent identited contained in scenario
     */
    @GetMapping(value = {"/hierarchies/byChildren/"})
    public Map<String, String> getAllChildParentHierarchiesByScenario(@RequestParam String scenario) {
        log.info("retrieving all child identities and parents by {}", scenario);

        Map<String, Object> params = new HashMap<>();
        params.put("scenario", scenario);

        Session session = driver.session();
        Result result = session.run("Match (p)-[r:includes]->(c)-[o]-() where o.scenario is not null and $scenario in o.scenario return distinct ID(c),ID(p)", params);

        Map<String, String> parentMap = new HashMap<>();
        while (result.hasNext()) {
            Record record = result.next();
            parentMap.put(record.get("ID(c)").toString(), record.get("ID(p)").toString());
        }

        return parentMap;
    }

    /**
     * get all parent identities with direct and indirect child identities
     *
     * @return all parent identities all direct/indirect child identities
     */
    @GetMapping(value = {"/hierarchies/byParent"})
    public Map<String, ArrayList<String>> getAllParentChildHierarchies() {
        log.info("retrieving all parent identities and children");

        Session session = driver.session();
        Result result = session.run("Match (k:parent)-[r:includes*]->(v)  return  ID(k),ID(v)");
        Map<String, ArrayList<String>> res = new HashMap<>();

        if (result.hasNext()) {
            result.stream().forEach(record -> {
                String key = record.get("ID(k)").toString();
                String value = record.get("ID(v)").toString();
                if (res.containsKey(key)) {
                    ArrayList<String> temp = res.get(key);
                    temp.add(value);
                    res.put(key, temp);
                } else {
                    res.put(key, new ArrayList<>(Collections.singleton(value)));
                }
            });
        }
        return res;
    }

    /**
     * get parent identities with their direct and indirect children that appear in the given scenario
     *
     * @param scenario specifying the desired hierarchy subset
     * @return all parent identities with direct/indirect child identities contained in scenario
     */
    @GetMapping(value = {"hierarchies/byParent/"})
    public Map<String, ArrayList<String>> getAllParentChildHierarchiesByScenario(@RequestParam String scenario) {
        log.info("retrieving all parent identities and children by {}", scenario);

        Map<String, Object> params = new HashMap<>();
        params.put("scenario", scenario);

        Session session = driver.session();
        Result result = session.run("Match (k:parent)-[r:includes*]->(v)-[o]-() Where o.scenario is not null and  $scenario in o.scenario return distinct  ID(k),ID(v)", params);
        Map<String, ArrayList<String>> res = new HashMap<>();

        if (result.hasNext()) {
            result.stream().forEach(record -> {
                String key = record.get("ID(k)").toString();
                String value = record.get("ID(v)").toString();
                if (res.containsKey(key)) {
                    ArrayList<String> temp = res.get(key);
                    temp.add(value);
                    res.put(key, temp);
                } else {
                    res.put(key, new ArrayList<>(Collections.singleton(value)));
                }
            });
        }
        return res;
    }

    /**
     * get parent of specified node
     *
     * @param identity of the node child node
     * @return direct parent identity
     */
    @GetMapping(value = {"{identity}/parent"})
    public String[] getDirectParent(@PathVariable int identity) {
        log.info("retrieving parent node identity of node {}", identity);
        Map<String, Object> params = new HashMap<>();
        params.put("identity", identity);


        Session session = driver.session();
        Result result = session.run("Match (p)-[r:includes]->(s) where ID(s) = $identity return ID(p)", params);

        //one node can only have one parent
        if (result.hasNext()) {
            Record record = result.single();
            return new String[]{record.get("ID(p)").toString()};
        }
        return new String[0];
    }

    /**
     * get all children of node
     *
     * @param identity of parent node
     * @return all direct and indirect child identities
     */
    @GetMapping(value = {"{identity}/children"})
    public List<String> getALlChildren(@PathVariable int identity) {
        log.info("retrieving all dirent and indirect child IDs of {}", identity);
        Map<String, Object> params = new HashMap<>();
        params.put("identity", identity);

        Session session = driver.session();
        Result result = session.run("Match (p)-[r:includes*]->(s) where ID(p) = $identity  return ID(s)", params);

        if (result.hasNext()) {
            return result.stream().map(record -> record.get("ID(s)").toString()).collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    /**
     * add new node to database
     *
     * @param node to be added
     * @return newly created node including ID
     */
    @PostMapping(value = "")
    public NodeObject addNode(@RequestBody NodeObject node) {
        System.out.println(node);

        Session session = driver.session();
        if (node.getLabels() == null || node.getLabels().isEmpty() || !node.getProps().containsKey("name")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY);
        }
        String labelsIn = String.join(":", node.getLabels());
        labelsIn = buildNodeLabels(node.getLabels());
        Result result = session.run("Create (s:" + labelsIn + " $props ) return s", parameters("props", node.getProps(), "labels", node.getLabels()));

        Node createdNode = result.single().get("s").asNode();

        List<String> labelsOut = new ArrayList<>();
        createdNode.labels().forEach(labelsOut::add);

        return new NodeObject(createdNode.elementId().split(":")[2], labelsOut, createdNode.asMap());
    }

    /**
     * Verifies that input labels are valid and concatenates them to be used in query. This is a bit
     * of a round about way of doing input sanitation, since prepared statements can't be used for setting labels
     * see: https://github.com/neo4j/neo4j/issues/4334
     *
     * @param labels list of label to be validated
     * @return String of : delimited valid labels
     */
    private String buildNodeLabels(List<String> labels) {
        List<String> labelList = new ArrayList<>();

        labels.forEach((label) -> {
            try{
                labelList.add(String.valueOf(NodeObject.TypeLabels.valueOf(label)));
            }catch (IllegalArgumentException ignored){
            }

            try{
                labelList.add(String.valueOf(NodeObject.FunctionalLabel.valueOf(label)));
            }catch (IllegalArgumentException ignored){
            }
        });

        if(labelList.isEmpty()){
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "invalid labels");
        }

        return String.join(":", labelList.toArray(new String[0]));
    }

}

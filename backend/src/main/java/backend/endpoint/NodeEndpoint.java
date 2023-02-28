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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/node")
@Slf4j
public class NodeEndpoint {

    Driver driver;

    @Autowired
    public NodeEndpoint(Environment env) {

        driver = GraphDatabase.driver(env.getProperty("neo4j.uri"),
                AuthTokens.basic(env.getProperty("neo4j.authentication.username"),
                        env.getProperty("neo4j.authentication.password")));
    }

    @GetMapping(value = "/{identity}")
    public NodeObject nodeById(@PathVariable int identity) {
        log.info("retrieving node with id:  {}", identity);
        Map<String, Object> params = new HashMap<>();
        params.put("identity", identity);

        Session session = driver.session();

        Result result = session.run("Match (p) where ID(p) = $identity  return (p)", params);

        if (result.hasNext()) {
            Record rec = result.single();
            Node node = rec.get("p").asNode();
            String elemId = node.elementId();
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

    @GetMapping(value = {"/all"})
    public Stream<NodeObject> allNodes() {
        log.info("retrieving all nodes");
        List<NodeObject> nodes = new ArrayList<>();

        Session session = driver.session();
        Result result = session.run("MATCH (n) RETURN n");

        while (result.hasNext()) {
            Record rec = result.next();
            Node node = rec.get("n").asNode();
            String identity = node.elementId();
            List<String> labels = new ArrayList<>();
            node.labels().forEach(labels::add);
            Map<String, Object> properties = node.asMap();

            NodeObject nodeObject = new NodeObject(identity, labels, properties);

            nodes.add(nodeObject);

        }

        return nodes.stream();
    }

    @GetMapping(value = {"{identity}/parent"})
    public String[] getParent(@PathVariable int identity) {
        log.info("retrieving parent node id of node  {}", identity);
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
}

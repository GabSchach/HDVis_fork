package backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;


/**
 * Class representing nodes as stored in database
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NodeObject {

    String identity;
    List<String> labels;

    Map<String, Object> props;

    @Override
    public String toString() {
        return "NodeObject{" +
                "id=" + identity +
                ", labels=" + labels +
                ", properties=" + props +
                '}';
    }

    /**
     * enum containing all node labels, that correspond with an image/symbol in visualization
     */
    public enum TypeLabels {
        database,
        databases,
        process,
        processes,
        institution,
        institutions,
        decision,
        event,
        document

    }

    /**
     * enum containing all node labels, that denote the relation between the node and other nodes
     */
    public enum FunctionalLabel{
        origin,
        parent,
        test
    }
}
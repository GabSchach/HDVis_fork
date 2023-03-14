package backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Class representing relationships including source and target nodes
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RelationshipObject {

    String identity;
    String labels;
    Map<String, Object> props;

    NodeObject source;
    NodeObject target;

    /**
     * enum containing all possible edge labels
     */
    public enum RelationshipLabels {
        transfers,
        includes,
        produces,
        conditional
    }
}
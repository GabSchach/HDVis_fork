package backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RelationshipObject {
    String identity;
    String labels;
    Map<String, Object> props;

    NodeObject source;
    NodeObject target;
}
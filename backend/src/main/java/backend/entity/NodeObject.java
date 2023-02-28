package backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

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
}
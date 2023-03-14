package backend.endpoint;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileDescriptor;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


/**
 * Endpoint to retrieve node symbols
 */
@RestController
@RequestMapping("/symbol")
@Slf4j
@RequiredArgsConstructor
public class SymbolEndpoint {

    /**
     * get symbol as SVG
     *
     * @param name of symbol including file extension
     * @return svg as byte[]
     */
    @GetMapping("/{name}")
    public ResponseEntity<byte[]> getSymbol(@PathVariable String name) {
        log.info("retrieving symbol with name {}",name);

        HttpHeaders header = new HttpHeaders();
        header.add("Content-Type","image/svg+xml");
        header.add("Cache-Control","max-age=600");

        try {
            Path path = Paths.get("../images/" + name);
            byte[] svg = Files.readAllBytes(path);
            return ResponseEntity.ok().headers(header).body(svg);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

}

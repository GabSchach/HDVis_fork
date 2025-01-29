{
    "name": "Java Neo4j Development",
    "dockerFile": "Dockerfile",
    "customizations": {
        "vscode": {
            "extensions": [
                "vscjava.vscode-java-pack",
                "vscjava.vscode-maven",
                "vscjava.vscode-spring-boot-dashboard",
                "redhat.vscode-xml",
                "ms-python.python"
            ]
        }
    },
    "forwardPorts": [
        8080,  // Spring Boot
        7474,  // Neo4j HTTP
        7687   // Neo4j Bolt
    ],
    "postCreateCommand": "mvn install -DskipTests"
}
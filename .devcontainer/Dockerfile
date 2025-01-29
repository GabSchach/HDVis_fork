FROM mcr.microsoft.com/devcontainers/java:17

# Install Maven
RUN apt-get update && apt-get install -y maven

# Install Python for frontend server
RUN apt-get install -y python3 python3-pip

# Install Neo4j
RUN wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apt-key add -
RUN echo 'deb https://debian.neo4j.com stable latest' | tee /etc/apt/sources.list.d/neo4j.list
RUN apt-get update && apt-get install -y neo4j

# Set environment variables
ENV NEO4J_AUTH=neo4j/password

# Expose ports
EXPOSE 8080 7474 7687
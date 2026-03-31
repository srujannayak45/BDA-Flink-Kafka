FROM maven:3.9-eclipse-temurin-11 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM flink:1.18.1-scala_2.12-java11
RUN mkdir -p /opt/flink/usrlib
COPY --from=builder /app/target/flink-game-processor-1.0.0.jar /opt/flink/usrlib/game-commentator.jar

FROM eclipse-temurin:17-jdk-alpine AS build
RUN apk add --no-cache curl
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src src
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p uploads/justificatifs uploads/images uploads/documents uploads/agent
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

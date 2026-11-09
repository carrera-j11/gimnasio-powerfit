# ---- Etapa 1: compilación con Maven ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
# Se quitan los finales de línea de Windows (CRLF) por si el archivo los tuviera
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN rm -f src/main/resources/secretos-local.properties \
 && ./mvnw -q -B package -DskipTests

# ---- Etapa 2: imagen liviana de ejecución ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Railway define PORT; Spring Boot lo lee en server.port
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

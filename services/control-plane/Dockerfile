# Nexus Weaver Control Plane - Prod Dockerfile

# Build Stage
FROM maven:3.9-eclipse-temurin-17 AS builder 

WORKDIR /build 

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B 

# Copy source code
COPY src ./src

# Build the app
RUN mvn clean package -DskipTests 

# Runtime stage 
FROM eclipse-temurin:17-jre-alpine 

RUN apk add --no-cache curl 

# Create non root user
RUN addgroup -g 1000 nexus && adduser -D -u 1000 -G nexus nexus 

WORKDIR /app

# Copy the built artifact
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown -R nexus:nexus /app

USER nexus 

# Expose port 
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Set JVM options and Spring profile
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE=prod

# Run app
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=$SPRING_PROFILES_ACTIVE -jar app.jar" ]
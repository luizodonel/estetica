# ==========================================
# ETAPA 1: Build do Frontend Angular
# ==========================================
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend

COPY estetica-web/package*.json ./
RUN npm install

COPY estetica-web/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Build do Backend Java (Maven)
# ==========================================
FROM maven:3.9-eclipse-temurin-17 AS build-backend
WORKDIR /app/backend

COPY estetica-api/pom.xml ./
RUN mvn dependency:go-offline -B

COPY estetica-api/src ./src

# Injeta os arquivos estáticos compilados do Angular no Spring Boot
COPY --from=build-frontend /app/frontend/dist/estetica-web/browser ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ==========================================
# ETAPA 3: Imagem Final de Execução
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
    && echo "America/Sao_Paulo" > /etc/timezone \
    && addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/uploads \
    && chown -R spring:spring /app
USER spring:spring

COPY --from=build-backend /app/backend/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV TZ=America/Sao_Paulo
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Duser.timezone=America/Sao_Paulo", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]


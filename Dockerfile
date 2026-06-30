FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS backend
ARG TARGETARCH
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -ldflags="-s -w" -o forge ./cmd/forge

FROM alpine:3.21
RUN apk add --no-cache bash ca-certificates
COPY --from=backend /app/forge /forge/forge
COPY --from=frontend /app/dist /forge/dist
WORKDIR /workspace
VOLUME ["/workspace"]
EXPOSE 8080
ENTRYPOINT ["/forge/forge", "--dist", "/forge/dist"]

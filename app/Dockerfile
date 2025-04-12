# -------- Stage 1: Build Next.js frontend --------
FROM node:20.2.0-alpine AS frontend-builder

WORKDIR /server/client
COPY client/package*.json ./
RUN npm install --force
COPY client/ ./
RUN npm run build

# -------- Stage 2: Build Go backend --------
FROM golang:1.23.3-alpine AS backend-builder

WORKDIR /server
COPY go.mod go.sum ./
RUN go mod tidy

COPY . ./
RUN go build -o server .

# -------- Stage 3: Final image --------
FROM alpine:latest

WORKDIR /server

# Copy Go binary
COPY --from=backend-builder /server/server .
COPY --from=backend-builder /server/.env .

# Copy built frontend static files
COPY --from=frontend-builder /server/client/out ./client/out


EXPOSE 8080

CMD ["./server"]


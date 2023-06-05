.PHONY: build run test

PROJECT_VERSION=v2.4

run: build
	./github2omnifocus

build:
	go build -ldflags="-X 'main.Version=$(PROJECT_VERSION)'" ./cmd/github2omnifocus

test:
	go test ./...

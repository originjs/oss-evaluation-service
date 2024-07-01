FROM ubuntu:24.04
LABEL maintainer="ruleeeer<ruleeeer.mail@gmail.com>"
WORKDIR /repo-service
RUN apt update -y && \
    apt install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt install -y \
    git \
    openjdk-17-jdk \
    maven \
    cloc \
    nodejs && \
    npm install -g pnpm
EXPOSE 3000
ENTRYPOINT ["sh", "-c", "pnpm install && pnpm start" ]

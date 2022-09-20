# syntax=docker/dockerfile:1

FROM ubuntu

WORKDIR /home/ci/project

RUN apt update

RUN apt install -y curl

RUN apt install -y default-jdk

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y nodejs

RUN npm i -g yarn http-server
RUN yarn global add expo
RUN yarn global add expo-cli
RUN yarn global add turtle-cli

COPY entrypoint.sh /.
RUN chmod +x /entrypoint.sh

COPY . /home/ci/project/.

ENTRYPOINT ["/entrypoint.sh"]
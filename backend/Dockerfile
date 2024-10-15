FROM node

WORKDIR /usr/src/app

COPY package*.json ./

# RUN apt-get update && apt-get install -y sudo
# RUN npm update
RUN npm install
# RUN npm audit fix --force
# RUN cd /usr/src/app && mkdir uploads
COPY . .

# RUN npx sequelize db:create

# RUN npx sequelize db:migrate

EXPOSE 8080

CMD ["node", "server.js"]
# CMD ["/bin/sh", "-c", "npx sequelize-cli db:create && npx sequelize-cli db:migrate && node server.js"]

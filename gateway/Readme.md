# How to Run Gateway Application

1. Install [nvm](https://github.com/nvm-sh/nvm) and use v16
1. Install and setup pm2
   1. npm install -g pm2
   1. pm2 startup (and follow the orders)
1. Setup the code
   1. Create .env file (see .env.example)
   1. npm i
   1. npm run build
1. Run the application
   1. pm2 start dist/gateway/main.js --name gw
   1. pm2 save

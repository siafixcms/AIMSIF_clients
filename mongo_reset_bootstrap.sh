#!/usr/bin/env bash

# mongo_reset_bootstrap.debug.sh — Debug Edition (MongoDB 7)

PRODUCTION_HOST="${PRODUCTION_HOST:-localhost}"
PORT="${PORT:-27017}"

generate_password() {
  tr -dc 'A-Za-z0-9' </dev/urandom | head -c 18
}

ADMIN_USER="${ADMIN_USER:-root}"
ADMIN_PWD="${ADMIN_PWD:-$(generate_password)}"

APP_DB="aimsif_clients"
APP_USER="${APP_USER:-aimsif_client}"
APP_PWD="${APP_PWD:-$(generate_password)}"

echo "ADMIN_USER=$ADMIN_USER"
echo "ADMIN_PWD=$ADMIN_PWD"
echo "APP_USER=$APP_USER"
echo "APP_PWD=$APP_PWD"

UBUNTU_VERSION=$(lsb_release -sc)
echo "UBUNTU_VERSION=$UBUNTU_VERSION"

if ! command -v mongod &>/dev/null; then
  echo "Installing MongoDB 7..."
  sudo apt-get purge -y mongodb mongodb-server mongodb-org* || true
  sudo rm -rf /var/log/mongodb /var/lib/mongodb

  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $UBUNTU_VERSION/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

  sudo apt-get update
  sudo apt-get install -y mongodb-org
else
  echo "✅ MongoDB already installed"
fi

if [[ -f /etc/mongod.conf ]]; then
  CONF=/etc/mongod.conf
  SERVICE=mongod
else
  echo "⚠️  No config found, creating default mongod.conf"
  CONF=/etc/mongod.conf
  SERVICE=mongod
  sudo tee "$CONF" > /dev/null <<EOF
storage:
  dbPath: /var/lib/mongodb
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
net:
  bindIp: 127.0.0.1
  port: $PORT
security:
  authorization: enabled
EOF
fi

echo "Using config: $CONF"

echo "Restarting MongoDB..."
sudo systemctl daemon-reexec
sudo systemctl restart "$SERVICE"
sleep 5

echo "Waiting for MongoDB to be ready..."
until (echo > /dev/tcp/127.0.0.1/$PORT) 2>/dev/null; do
  echo -n "."; sleep 1
done
echo "✔ Ready"

if command -v mongosh &>/dev/null; then
  MONGO_SHELL=mongosh
elif command -v mongo &>/dev/null; then
  MONGO_SHELL=mongo
else
  echo "❌ No mongo shell found"
  exit 1
fi

echo "Using shell: $MONGO_SHELL"

echo "Dropping any existing users..."
sudo sed -i '/authorization:/d' /etc/mongod.conf
sudo systemctl restart mongod
sleep 5

$MONGO_SHELL <<EOF
use admin
db.dropAllUsers()
use $APP_DB
db.dropAllUsers()
EOF

echo "Creating admin user..."
$MONGO_SHELL <<EOF
use admin
db.createUser({
  user: "$ADMIN_USER",
  pwd: "$ADMIN_PWD",
  roles: [ { role: "root", db: "admin" } ]
})
EOF

echo "Restarting MongoDB with authorization enabled..."
sudo sed -i '/authorization:/d' /etc/mongod.conf
sudo sed -i '/security:/a\  authorization: enabled' /etc/mongod.conf
sudo systemctl restart mongod
sleep 5

echo "Creating app user (authenticated)..."
$MONGO_SHELL "mongodb://$ADMIN_USER:$ADMIN_PWD@$PRODUCTION_HOST:$PORT/admin?authSource=admin" <<EOF
use $APP_DB
db.createUser({
  user: "$APP_USER",
  pwd: "$APP_PWD",
  roles: [{ role: "readWrite", db: "$APP_DB" }]
})
EOF

echo "✅ DONE"
echo ""
echo "MONGODB_URI=mongodb://$APP_USER:$APP_PWD@$PRODUCTION_HOST:$PORT/$APP_DB?authSource=$APP_DB"

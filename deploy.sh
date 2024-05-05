#!/usr/bin/bash

function exitIfError {
  if [ $? -ne 0 ]; then
    echo "$1"
    exit 1
  fi
}

git pull
exitIfError "git pull failed"

npm i
exitIfError "npm install failed"

pm2 kill
exitIfError "pm2 kill failed"

pm2 start npm --name shabadApi -- start
pm2 save

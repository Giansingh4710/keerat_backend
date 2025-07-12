#!/usr/bin/bash

docker cp keerat_backend:/app/assets/data.csv ./assets/

sudo git add ./assets/data.csv
sudo git commit -m "updated data.csv via cron"
sudo git push

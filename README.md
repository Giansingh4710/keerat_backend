# How I setup the server for the shabad api

### Configure EC2 Ubuntu Instance
- Create EC2 instance. Make sure to click ubuntu and also allow http and https traffic.
- ```sudo apt update && sudo apt upgrade && sudo apt install nginx```
- ```
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
    sudo apt-get install -y nodejs
    node -v && npm -v
    ```
- Firewall Stuff (idk)
    - ```
        sudo ufw allow OpenSSH
        sudo ufw allow 'Nginx HTTP'
        sudo ufw enable
        sudo ufw status
    ```
- At this point you should be able to see the nginx page when you go to the ip address of the server
    - ```curl 54.226.218.23``` (this should work too if done correctly)
- For Domain Setup
    - `sudo mkdir /var/www/keerat_backend`
    - `sudo chown -R $USER:$USER /var/www/keerat_backend`
    - copy the below in `sudo vim /etc/nginx/sites-available/keerat_backend`
        ```
        server {
            server_name giansingh4710.xyz www.giansingh4710.xyz;

            location / {
                proxy_pass http://localhost:3000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
        }
        ```
    - `sudo ln -s /etc/nginx/sites-available/keerat_backend /etc/nginx/sites-enabled/keerat_backend`
    -  to check if syntax is correct
        - `sudo nginx -t`
    - to reload
        - `sudo nginx -s reload`

- At this point, if you clone repo into `/var/www/keerat_backend` and do 'sudo npm run dev', site should be live on the domain name.
    - `sudo git clone https://github.com/Giansingh4710/keerat_backend /var/www/keerat_backend`
    - `cd /var/www/keerat_backend`
    - `./deploy.sh`

### How to setup https
- ```
    sudo ufw allow 'Nginx Full'
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d giansingh4710.xyz -d www.giansingh4710.xyz
    sudo systemctl status certbot.timer
    sudo ufw delete allow 'Nginx HTTP'
    sudo ufw status
    ```


### Run Scripts in Background
    - `crontab mycron.txt`

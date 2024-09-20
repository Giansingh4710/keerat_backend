# How I setup the server for the shabad api
### Get Domain Name and Host it on AWS
- Bought namecheap domain. 
- Go -> Route 53, hosted zone, Create Hosted Zone with domain name.
- Copy NS records from Route 53 and paste it in namecheap domain.
- For me they were:
    - ns-1289.awsdns-33.org.
    - ns-735.awsdns-27.net.
    - ns-1975.awsdns-54.co.uk.
    - ns-504.awsdns-63.com.
- In namecheap under the domain, got to nameservers. Select custom DNS and paste the ns-* records they show for you in aws.
- Create Record
    - Subdomain: (leave blank)
    - Record type: A - Routes traffic to an IPv4 address and some AWS resources.
    - Value: IP address of the EC2 instance.
- Create Record (2)
    - Subdomain: www
    - Record type: A - Routes traffic to an IPv4 address and some AWS resources.
    - Toggle on Alias
    - Route traffic to: 'Alias to another record in this hosted zone'
    - Choose your domain name
- Will Take some time to reflect the changes.

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
    - ```
        sudo mkdir /var/www/getshabads.xyz
        sudo chown -R $USER:$USER /var/www/getshabads.xyz
    ```
    - ```sudo vim /etc/nginx/sites-available/getshabads.xyz```
        - copy this into the file:
            ```
            server {
                server_name getshabads.xyz www.getshabads.xyz;

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
    - ```sudo ln -s /etc/nginx/sites-available/getshabads.xyz /etc/nginx/sites-enabled/getshabads.xyz```
    - ```sudo nginx -t``` to check if syntax is correct
    - ```sudo nginx -s reload``` to reload nginx
- At this point, if you clone repo into `/var/www/getshabads.xyz` and do 'sudo npm run dev', site should be live on the domain name.
    - ```sudo git clone https://github.com/Giansingh4710/shabadApi /var/www/getshabads.xyz```
- ```sudo npm install pm2@latest -g``` keep server in background
- ```sudo pm2 startup systemd``` (it will give you a command to run. Run it. Command for me is below)
    ```sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu```
- ```pm2 start npm --name yankPaste -- start```
    - ```pm2 kill``` (will kill the server if needed)
- ```pm2 save``` (when pm2 restarts, it will start the server again)

### How to setup https
- ```
    sudo ufw allow 'Nginx Full'
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d getshabads.xyz -d www.getshabads.xyz
    sudo systemctl status certbot.timer
    sudo ufw delete allow 'Nginx HTTP'
    sudo ufw status
```


### Run Scripts in Background
- ```crontab mycron.txt```

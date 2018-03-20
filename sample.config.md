# Sample apache and supervisor config for paste

This is a sample apache vhost config for the paste service

    <VirtualHost *:80>
    ServerAdmin you@yourdomain.com
    ServerName paste.yourdomain.com
    DocumentRoot "/var/www/paste.yourdomain.com"
    ProxyPreserveHost On
    ProxyPassMatch ^/(.*)$ http://127.0.0.1:4004/$1
    </VirtualHost>


Then a sample supervisor config:

    [program:paste]
    command=/var/www/paste.yourdomain.com/venv/bin/waitress-serve --listen=127.0.0.1:4004 paste:app
    directory=/var/www/paste.yourdomain.com/
    user=paste
    group=paste
    autostart=true
    autorestart=true
    redirect_stderr=true
    environment=PASTE_PATH=/var/www/paste.yourdomain.com/db,PASTE_ID_LENGTH=10,PASTE_KEY_LENGTH=10



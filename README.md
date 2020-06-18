# paste

A basic encrypted pastebin.

Expects these environment variables to be set:

    PASTE_PATH = location where paste files will be stored, defaults to 'paste'
    PASTE_ID_LENGTH = number of characters in the paste ID, defaults to '16', which is around 95 bits of entropy
    PASTE_KEY_LENGTH = number of octets in the paste encryption key, defaults to '32', which produces 256 bits of entropy

For most applications PASTE_ID_LENGTH and PASTE_KEY_LENGTH could be shortened, though PASTE_KEY_LENGTH cannot
be shortened below 16.

# Running on NixOS

Here's an example `httpd` config for NixOS:

    imports = [
        ./service.nix
    ];

    services.paste.enable = true;	
    services.paste.port = 4000;	
    services.paste.pasteIdLength = 10;
    services.paste.pasteKeyLength = 16;

    security.acme.acceptTerms = true;
    security.acme.email = "michael@example.com";

    services = {
        httpd = {
            enable = true;
            adminAddr = "michael@example.com";
            extraModules = ["proxy_http"];
            virtualHosts = {
                "paste.hotplate.co.nz" = {
                    enableACME = true;
                    forceSSL = true;
                    documentRoot = "/srv/www/empty";
                    extraConfig = ''
                        ProxyPass /.well-known/acme-challenge/ !
                        ProxyPass / http://localhost:${toString config.services.paste.port}/
                        ProxyPassReverse / http://localhost:${toString config.services.paste.port}/
                    '';
                };
            };
        };
    };


{ lib, pkgs, config, ... }:
let
  cfg = config.services.paste;
  appEnv = pkgs.python3.withPackages (p: with p; [ waitress (callPackage ./default.nix {}) ]);
  
  apparmor_profile = writeText "paste.apparmor" ''
      #include <tunables/global>
      
      ${appEnv}/bin/waitress-serve {
          #include <abstractions/base>
          ${appEnv}/bin/waitress-serve r,
      }
  '';

in {
  options.services.paste = {
    enable = lib.mkEnableOption "paste";

    port = lib.mkOption {
      type = lib.types.int;
      default = 8080;
      description = "The localhost TCP port on which the service will listen";
    };

    pasteIdLength = lib.mkOption {
      type = lib.types.int;
      default = 16;
      description = "Number of characters used for paste IDs";
    };

    pasteKeyLength = lib.mkOption {
      type = lib.types.int;
      default = 32;
      description = "Number of octets in the paste encryption key";
    };

    pastePath = lib.mkOption {
      type = lib.types.str;
      default = "/srv/www/paste";
      description = "Location in the filesystem where pastes will be stored";
    };

    user = lib.mkOption {
      type = lib.types.str;
      default = "paste";
      description = "UID which paste will be run as";
    };

    group = lib.mkOption {
      type = lib.types.str;
      default = "paste";
      description = "GID which paste will be run as";
    };
  };

  config = lib.mkIf cfg.enable {

    users.users.paste = {
      isSystemUser = true;
      group = "paste";
      description = "Paste daemon user";
    };

    users.groups.paste.gid = null;

    systemd.services.paste = {
      wantedBy = [ "multi-user.target" ];
      description = "Encrypted pastebin server";
      unitConfig.Documentation = "https://github.com/fincham/paste";
      environment = {
        PASTE_PATH = "${cfg.pastePath}";
        PASTE_ID_LENGTH = "${toString cfg.pasteIdLength}";
        PASTE_KEY_LENGTH = "${toString cfg.pasteKeyLength}";
      };
      serviceConfig = {
        ExecStart = "${appEnv}/bin/waitress-serve --listen=127.0.0.1:${toString cfg.port} paste:app";
	User = "${cfg.user}";
	Group = "${cfg.group}";
        StandardOutput = "syslog";
        StandardError = "syslog";
        SyslogIdentifier= "paste";
      };
    };
  };
}

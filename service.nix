{ lib, pkgs, config, ... }:
let
  cfg = config.services.paste;
  appEnv = pkgs.python3.withPackages (p: with p; [ waitress (callPackage ./default.nix {}) ]);
in {
  options.services.paste = {
    enable = lib.mkEnableOption "paste";

    port = mkOption {
      type = types.int;
      default = 8080;
      description = "The localhost TCP port on which the service will listen";
    };

    pasteIdLength = mkOption {
      type = types.int;
      default = 16;
      description = "Number of characters used for paste IDs";
    };

    pasteKeyLength = mkOption {
      type = types.int;
      default = 32;
      description = "Number of octets in the paste encryption key";
    };

    pastePath = mkOption {
      type = types.str;
      default = "/srv/www/paste";
      description = "Location in the filesystem where pastes will be stored"
    };

    user = mkOption {
      default = "paste";
      description = "UID which paste will be run as";
    };

    group = mkOption {
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
      serviceConfig = {
        ExecStart = "${appEnv}/bin/waitress-serve --listen=127.0.0.1:${cfg.port} paste:app";
        Environment = "PASTE_PATH=${cfg.pastePath},PASTE_ID_LENGTH=${cfg.pasteIdLength},PASTE_KEY_LENGTH=${cfg.pasteKeyLength}";
	User = "${cfg.user}";
	Group = "${cfg.group}";
      };
    };
  };
}

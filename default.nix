with (import <nixpkgs> {});
derivation rec {
  name = "nomicon-frontend";
  system = builtins.currentSystem;

  src = builtins.filterSource
    (path: type:
      let filename = baseNameOf path; in
      !(
        filename == "node_modules" && type == "directory" ||
        filename == "result"       && type == "symlink"
      )
    )
  ./.;

  node_modules = import ./deps.nix;
  node = nodejs-12_x;

  PATH = "${coreutils}/bin:${node}/bin";
  builder = "${bash}/bin/bash";
  args = [ ./builder.sh ];
}

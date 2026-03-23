{
  description = "doodee-future dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          bun
          nodejs_20
          prisma-engines
          python3
          gcc
          gnumake
          pkg-config
          cairo
          pango
          libjpeg
          giflib
          librsvg
          openssl
        ];
        shellHook = ''
          # Use Nix-provided Prisma schema engine on NixOS.
          export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
          # Avoid checksum fetch failures when Prisma tries to verify engine downloads.
          export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
        '';
      };
    };
}

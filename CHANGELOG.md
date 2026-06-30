# Changelog

## [1.0.7](https://github.com/rany-abounaem/forge/compare/v1.0.6...v1.0.7) (2026-06-30)


### Bug Fixes

* remove find debug from Dockerfile, restore GHA cache ([5741edb](https://github.com/rany-abounaem/forge/commit/5741edbd518bf24e3891b3a2a5d331a85c481c18))
* track cmd/forge/main.go and anchor gitignore forge pattern ([b0693a2](https://github.com/rany-abounaem/forge/commit/b0693a28ec4dd655fccd105b70c24cfd41ee3cc4))

## [1.0.6](https://github.com/rany-abounaem/forge/compare/v1.0.5...v1.0.6) (2026-06-30)


### Bug Fixes

* add find debug to show what files are in /app after COPY ([22fd756](https://github.com/rany-abounaem/forge/commit/22fd756689af87656358988d83caea2866181156))

## [1.0.5](https://github.com/rany-abounaem/forge/compare/v1.0.4...v1.0.5) (2026-06-30)


### Bug Fixes

* disable GHA layer cache to clear stale COPY layer ([6ef176d](https://github.com/rany-abounaem/forge/commit/6ef176dd8aea7ea52f824e6aee0360ab8cfbe1c1))

## [1.0.4](https://github.com/rany-abounaem/forge/compare/v1.0.3...v1.0.4) (2026-06-30)


### Bug Fixes

* remove bare 'forge' from .dockerignore ([5c2e5e2](https://github.com/rany-abounaem/forge/commit/5c2e5e2cc27e78f290fdf7815cfde1b5a48466c0))

## [1.0.3](https://github.com/rany-abounaem/forge/compare/v1.0.2...v1.0.3) (2026-06-30)


### Bug Fixes

* anchor .dockerignore forge pattern to root only ([c64e48d](https://github.com/rany-abounaem/forge/commit/c64e48dd55df7c80eb30cacfb7d94ed5c088b59f))

## [1.0.2](https://github.com/rany-abounaem/forge/compare/v1.0.1...v1.0.2) (2026-06-30)


### Bug Fixes

* add verbose go build output to diagnose CI failure ([e3e4ab2](https://github.com/rany-abounaem/forge/commit/e3e4ab228ceda24622b24c4b4b393df7282391f3))

## [1.0.1](https://github.com/rany-abounaem/forge/compare/v1.0.0...v1.0.1) (2026-06-30)


### Bug Fixes

* use native cross-compilation for multi-arch Docker builds ([02edeef](https://github.com/rany-abounaem/forge/commit/02edeef453710f3e3bd2b2c643e90ecec2be57ec))

## 1.0.0 (2026-06-30)


### Features

* add Docker image and automated release pipeline ([e68c0da](https://github.com/rany-abounaem/forge/commit/e68c0da6a67d8167a2ba1d2b9104c2af8c2efc81))

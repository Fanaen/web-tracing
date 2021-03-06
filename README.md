# Web-tracing

Path tracer à embarquer dans une application web. 
Le projet n'est pas prêt pour une utilisation en production.

Web-tracing est composé :
 - du path tracer sous forme d'un module javascript, le coeur du projet, `wasm-module`

## Contribution

Outils requis pour compiler le projet :
 - [Rust (à installer avec rustup)](https://rustup.rs/)
 - [Wasm-pack](https://rustwasm.github.io/wasm-pack/)
 - [Yarn](https://yarnpkg.com/fr/)

## Commandes
### wasm-module
Le module utilisable directement depuis le navigateur ; écrit en Rust et compilé en Webassembly.
```bash
# Construire le module 
yarn build:wasm-module

# Tester le module
yarn test:wasm-module
```
 
### viewer
Une GUI pour tester le path-tracer. C'est une application web compilée avec webpack. 
Une fois lancée, il faut se rendre sur [http://localhost:8080](http://localhost:8080).
```bash
# Construire le viewer
yarn build:viewer

# Construire et lancer le viewer.
yarn run:viewer
```
 
### Utilitaires
```bash
# -- Style --
# Reformater le code Rust (avec rust-fmt)
yarn fmt

# -- Bloat --
# Afficher les plus grosses fonctions dans wasm-module
yarn bloat:functions
yarn bloat:functions -n 100 # pour en afficher 100

# Afficher les plus grosses dépendances dans wasm-module
yarn bloat:deps
yarn bloat:deps -n 100 # pour en afficher 100
```
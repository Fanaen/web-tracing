# Web-tracing

Path tracer à embarquer dans une application web. 
Le projet n'est pas prêt pour une utilisation en production.

Web-tracing est composé :
 - du path tracer sous forme d'un module javascript, le coeur du projet, `wasm-module`
 - d'un serveur et d'un viewer pour pouvoir tester/profiler le path tracer

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

### server
La version native du path-tracer. C'est une appli écrite en Rust qui embarque wasm-module.
```bash
# Construire le serveur
yarn build:server

# Construire et lancer le serveur
yarn run:server
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
# Reformater le code Rust (avec rust-fmt)
yarn fmt

# Afficher les plus grosses fonctions dans wasm-module
yarn bloat:functions

# Afficher les plus grosses dépendances dans wasm-module
yarn bloat:functions
```
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

### wasm-module

Le module utilisable directement depuis le navigateur.
 - Construire le module : `yarn build:wasm-module`
 - Tester le module : `yarn test:wasm-module`
 
### server
La version native du path-tracer
 - Construire le serveur : `yarn build:server`
 - Construire et lancer le serveur : `yarn run:server`
 
### viewer
Une GUI pour tester le path-tracer
 - Construire le viewer : `yarn build:viewer`
 - Lancer le viewer : `yarn run:viewer`
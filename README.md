# Web-tracing

Toy path tracing engine for browsers. The project isn't started yet.

## 🚴 Usage

The project is based on the template [wasm-pack-template](https://github.com/rustwasm/wasm-pack-template). 
Refer to this [tutorial](https://rustwasm.github.io/docs/book/game-of-life/hello-world.html) for more informations.

### 🛠️ Build with `wasm-pack build`

```
wasm-pack build
```

### 🔬 Test in Headless Browsers with `wasm-pack test`

```
wasm-pack test --headless --firefox
```

### 🎁 Publish to NPM with `wasm-pack publish`

```
wasm-pack publish
```

## 🔋 Batteries Included

* [`wasm-bindgen`](https://github.com/rustwasm/wasm-bindgen) for communicating
  between WebAssembly and JavaScript.
* [`console_error_panic_hook`](https://github.com/rustwasm/console_error_panic_hook)
  for logging panic messages to the developer console.
* [`wee_alloc`](https://github.com/rustwasm/wee_alloc), an allocator optimized
  for small code size.

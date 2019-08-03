window.objectId = window.objectId || 0;

function accessWebtracing(callback) {
    if (window.webtracing) {
        callback(window.webtracing);
    } else{
        setTimeout(() => accessWebtracing(callback), 50);
    }
}

function convertHex(hex,alpha){
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return { r, g, b, a: alpha };
}

function getLightProperties(component) {
    console.log("Get light properties.");
    console.log(component);
    return {
        position: component.el.object3D.position,
        intensity: 1.0
    };
}

// Registering component in foo-component.js
AFRAME.registerComponent('rendered-light', {
    schema: {},
    init: function () {
        console.log("Light init.");
        this.objectId = window.objectId++;

        const position = this.el.object3D.position;
        this.lastPosition = { x: position.x, y: position.y, z: position.z };
        accessWebtracing(wasm => wasm.createOrEditLight(this.objectId, getLightProperties(this)));
    },
    update: function () {
        console.log("Light update.");
        const position = this.el.object3D.position;
        this.lastPosition = { x: position.x, y: position.y, z: position.z };
        accessWebtracing(wasm => wasm.createOrEditLight(this.objectId, getLightProperties(this)));
    },
    tick: function () {
        // Update is not called when the color or the position changes. We have to check every tick for this
        const position = this.el.object3D.position;

        if (this.lastPosition.x !== position.x
            || this.lastPosition.y !== position.y
            || this.lastPosition.z !== position.z) {
            accessWebtracing(wasm => wasm.createOrEditLight(this.objectId, getLightProperties(this)));
            this.lastPosition = { x: position.x, y: position.y, z: position.z };
        }
    },
    remove: function () {
        console.log("Light remove.");
        accessWebtracing(wasm => wasm.removeLight(this.objectId));
    },
    pause: function () {},
    play: function () {}
});

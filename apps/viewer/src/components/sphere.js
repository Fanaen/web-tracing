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

function getSphereProperties(component) {
    return {
        position: component.el.object3D.position,
        radius: component.el.components.geometry.data.radius,
        material: {
            type: 'diffuse',
            albedo: convertHex(component.el.components.material.data.color, 255),
        }
    };
}

// Registering component in foo-component.js
AFRAME.registerComponent('rendered-sphere', {
    schema: {},
    init: function () {
        this.objectId = window.objectId++;

        const position = this.el.object3D.position;
        this.lastPosition = { x: position.x, y: position.y, z: position.z };
        this.lastColor = this.el.components.material.data.color;
        accessWebtracing(wasm => wasm.addSphere(this.objectId, getSphereProperties(this)));
    },
    update: function () {
        const position = this.el.object3D.position;
        this.lastPosition = { x: position.x, y: position.y, z: position.z };
        this.lastColor = this.el.components.material.data.color;
        accessWebtracing(wasm => wasm.updateSphere(this.objectId, getSphereProperties(this)));
    },
    tick: function () {
        // Update is not called when the color or the position changes. We have to check every tick for this
        const position = this.el.object3D.position;
        const color = this.el.components.material.data.color;

        if (this.lastPosition.x !== position.x
            || this.lastPosition.y !== position.y
            || this.lastPosition.z !== position.z
            || this.lastColor !== color) {
            accessWebtracing(wasm => wasm.updateSphere(this.objectId, getSphereProperties(this)));
            this.lastPosition = { x: position.x, y: position.y, z: position.z };
        }
    },
    remove: function () {
        accessWebtracing(wasm => wasm.removeSphere(this.objectId));
    },
    pause: function () {},
    play: function () {}
});
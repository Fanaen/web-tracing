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

function getTriangleProperties(component) {
    return {
        vertexA: component.el.components.geometry.data.vertexA,
        vertexB: component.el.components.geometry.data.vertexB,
        vertexC: component.el.components.geometry.data.vertexC,
        material: {
            type: 'diffuse',
            albedo: convertHex(component.el.components.material.data.color, 255),
        }
    };
}

// Registering component in foo-component.js
AFRAME.registerComponent('rendered-triangle', {
    schema: {},
    init: function () {
        this.objectId = window.objectId++;

        const position = this.el.object3D.position;
        accessWebtracing(wasm => wasm.addTriangle(this.objectId, getTriangleProperties(this)));
    },
    update: function () {
        const position = this.el.object3D.position;
        accessWebtracing(wasm => wasm.updateTriangle(this.objectId, getTriangleProperties(this)));
    },
    remove: function () {
        accessWebtracing(wasm => wasm.removeTriangle(this.objectId));
    },
    pause: function () {},
    play: function () {}
});
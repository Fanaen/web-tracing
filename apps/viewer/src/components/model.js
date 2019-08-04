window.objectId = window.objectId || 0;

function accessWebtracing(callback) {
    if (window.webtracing) {
        callback(window.webtracing);
    } else{
        setTimeout(() => accessWebtracing(callback), 50);
    }
}

function getModelProperties(component) {
    const modelComponents = component.el.components['gltf-model'] || component.el.components['obj-model'];
    const model = modelComponents.model;
    if (model) {

        console.log('model', model);
        return model.children
            .map(m => m.geometry)
            .filter(g => !!g)
            .map(geometry => ({
                position: component.el.object3D.position,
                vertices: geometry.attributes.position.array,
                triangles: geometry.index ? geometry.index.array : []
            }));
    }
    else {
        console.log('No model yet');
        throw new Error('No model yet');
    }
}

// Registering component in foo-component.js
AFRAME.registerComponent('rendered-model', {
    schema: {},
    initModel: function() {
        if (!this.isInit) {
            accessWebtracing(wasm => {
                try {
                    const models = getModelProperties(this);
                    for (const model of models) {
                        wasm.addModel(this.objectId, model);
                        console.log('addModel');
                    }
                    this.isInit = true;
                }
                catch (err) {
                    console.log(err);
                    setTimeout(() => this.initModel(), 10);
                }
            });
        }
    },
    init: function () {
        this.objectId = window.objectId++;
        this.isInit = false;

        const position = this.el.object3D.position;
        this.lastPosition = { x: position.x, y: position.y, z: position.z };
        this.initModel();
    },
    update: function () {
        const position = this.el.object3D.position;
        if (this.isInit) {
            this.lastPosition = { x: position.x, y: position.y, z: position.z };
            accessWebtracing(wasm => {
                const models = getModelProperties(this);
                let i = 0;
                for (const model of models) {
                    if(i === 0) wasm.updateModel(this.objectId, model);
                    else wasm.addModel(this.objectId, model);
                    i++;
                    console.log('updateModel');
                }
            });
        }
    },
    tick: function () {
        // Update is not called when the color or the position changes. We have to check every tick for this
        const position = this.el.object3D.position;

        if (this.isInit && (this.lastPosition.x !== position.x
            || this.lastPosition.y !== position.y
            || this.lastPosition.z !== position.z)) {
            accessWebtracing(wasm => {
                const models = getModelProperties(this);
                let i = 0;
                for (const model of models) {
                    if(i === 0) wasm.updateModel(this.objectId, model);
                    else wasm.addModel(this.objectId, model);
                    i++;
                    console.log('updateModel');
                }
            });
            this.lastPosition = { x: position.x, y: position.y, z: position.z };
        }
    },
    remove: function () {
        if (this.isInit) {
            accessWebtracing(wasm => wasm.removeModel(this.objectId));
        }
    },
    pause: function () {},
    play: function () {}
});

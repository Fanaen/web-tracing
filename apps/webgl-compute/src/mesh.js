
export class Mesh {
    constructor(name, vertices, indices) {
        this.name = name;
        this.vertices = vertices;
        this.indices = indices;
        this.triangle_count = indices.length / 3;
        this.vertice_count = vertices.length / 3;
        this.offset = undefined;
    }

    static get_padding()
    {
        // See mesh.glsl.
        // 
        // int offset; 4 bytes
        // int triangle_count; 4 bytes
        return 8;
    }
}

export function create_meshes_buffer(meshes)
{
    const buffer = new ArrayBuffer(meshes.length * Mesh.get_padding());

    const int32Data = new Int32Array(buffer);

    for (let index = 0; index < meshes.length; index++) {
        const element = meshes[index];

        int32Data[2 * index] = element.offset;
        int32Data[2 * index + 1] = element.triangle_count;
    }

    console.log("Meshes buffer: ", int32Data);

    return buffer;
}
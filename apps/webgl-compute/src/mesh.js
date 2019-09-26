
export class Mesh {
    constructor(name, vertices, indices) {
        this.name = name;
        this.vertices = vertices;
        this.indices = indices;
        this.triangle_count = indices.length / 3;
        this.vertice_count = vertices.length / 3;
        this.offset = undefined;
        this.diffuse_color = glm.vec3(0.4, 0.4, 0.4);
        this.emission = 0.0;
    }

    static get_padding()
    {
        // See mesh.glsl.
        // 
        // int offset; 4 bytes
        // int triangle_count; 4 bytes
        // vec3 diffuse_color; 12 bytes
        // total : 20
        return 4 + 4 + 4 + 12;
    }
}

export function create_meshes_buffer(meshes)
{
    const buffer = new ArrayBuffer(meshes.length * Mesh.get_padding());

    const int32Data = new Int32Array(buffer);
    const float32Data = new Float32Array(buffer);

    const padding = 6;

    for (let index = 0; index < meshes.length; index++) {
        const element = meshes[index];

        int32Data[padding * index] = element.offset;
        int32Data[padding * index + 1] = element.triangle_count;
        float32Data[padding * index + 2] = element.emission;
        float32Data[padding * index + 3] = element.diffuse_color.x;
        float32Data[padding * index + 4] = element.diffuse_color.y;
        float32Data[padding * index + 5] = element.diffuse_color.z;
    }

    console.log("Meshes buffer: ", buffer.byteLength, int32Data, float32Data);

    return buffer;
}
export const syncSchema = {
    id: "/Sync",
    type: "object",
    properties: {
        lastSync: { type: "string" },
        nextToken: { type: "string" }
    },
    required: ["lastSync"]
}

export const updateConfigSchema = {
    id: "/UpdateConfig",
    type: "array",
    items: {
        type: "object",
        properties: {
            pk: { type: "string" },
            sk: { type: "string" },
            description: { type: "string" },
            updatedAt: { type: "string" }
        },
        required: ["pk", "sk", "updatedAt"]
    }
}
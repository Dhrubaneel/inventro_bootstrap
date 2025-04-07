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

export const updateInventrySchema = {
    id: "/UpdateInventry",
    type: "array",
    items: {
        type: "object",
        properties: {
            itemId: { type: "string" },
            brand: { type: "string" },
            category: { type: "string" },
            expiresOn: { type: "number" },
            itemName: { type: "string" },
            location: { type: "string" },
            price: { type: "number" },
            quantity: { type: "number" },
            supplier: { type: "string" },
            type: { type: "string" },
            unit: { type: "string" },
            updatedAt: { type: "string" }
        },
        required: ["itemId", "brand", "category", "expiresOn", "itemName", "location", "price", "quantity", "supplier", "type", "unit", "updatedAt"]
    }
}
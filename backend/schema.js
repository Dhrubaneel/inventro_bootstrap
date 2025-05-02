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

export const updateTransactionSchema = {
    id: "/UpdateTransaction",
    type: "array",
    items: {
        type: "object",
        properties: {
            itemId: { type: "string" },
            transactionId: { type: "string" },
            timestamp: { type: "string" },
            transactionType: { type: "string", enum: ["add", "remove"] },
            itemName: { type: "string" },
            type: { type: "string" },
            category: { type: "string" },
            brand: { type: "string" },
            quantityChanged: { type: "number" },
            unit: { type: "string" },
            price: { type: "number" },
            mrp: { type: "number" },
            pricePerUnit: { type: "number" },
            mrpPerUnit: { type: "number" },
            supplier: { type: "string" },
            location: { type: "string" },
            partialTransaction: { type: "boolean" }
        },
        required: ["itemId", "transactionId", "timestamp", "transactionType", "itemName", "type", "category", "brand", "quantityChanged", "unit", "location"]
    }
}

export const fetchInventorySchema = {
    id: "/GetInventory",
    type: "object",
    properties: {
        nextToken: { type: "string" }
    }
}
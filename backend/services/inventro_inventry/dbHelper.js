import { syncCloudData } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });



export async function syncCloudInventory(lastSync, nextToken = undefined) {
    const params = {
        TableName: process.env.INVENTRY_TABLE,
        FilterExpression: "#updatedAt > :lastSync",
        ExpressionAttributeNames: {
            "#updatedAt": "updatedAt"
        },
        ExpressionAttributeValues: {
            ":lastSync": lastSync
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };
    return await syncCloudData(params);
}
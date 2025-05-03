import { queryCloudData } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

export async function syncCloudShoppingList(dataType, nextToken = undefined) {
    const params = {
        TableName: process.env.SHOPPING_LIST_TABLE,
        IndexName: 'items_by_dataType',
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames: {
            "#pk": dataType,
        },
        ExpressionAttributeValues: {
            ":pkValue": 'inventory',
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };
    return await queryCloudData(params);
}
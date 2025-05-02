import { queryCloudData } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

export async function getAllTransactionsOfAnItemId(pkValue, nextToken = undefined) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        IndexName: 'transaction_by_itemId', 
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "attribute_not_exists(#expiredBy)",
        ExpressionAttributeNames: {
            "#pk": "pk",
            "#expiredBy": "expiredBy"
        },
        ExpressionAttributeValues: {
            ":pkValue": pkValue, 
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };

    return await queryCloudData(params);
}
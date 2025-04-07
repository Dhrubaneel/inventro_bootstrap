import { updateItems } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });


export async function upsertCloudInventory(items) {
    return await updateItems(process.env.INVENTRY_TABLE, items, (item, tableName) => ({
        TableName: tableName,
        Key: {
            itemId: item.itemId // Use itemId as the partition key
        },
        UpdateExpression: `SET ${Object.keys(item)
            .filter(key => key !== "itemId") // Exclude the partition key from the update
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ConditionExpression: "attribute_not_exists(updatedAt) OR updatedAt < :currentUpdatedAt",
        ExpressionAttributeNames: Object.keys(item)
            .filter(key => key !== "itemId") // Exclude the partition key from attribute names
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(item)
            .filter(key => key !== "itemId") // Exclude the partition key from attribute values
            .reduce((acc, key) => {
                acc[`:${key}`] = item[key];
                return acc;
            }, { ":currentUpdatedAt": item.updatedAt }),
        ReturnValues: "NONE"
    }));
}
import { updateItems } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });


export async function updateCloudInventory(items) {
    return await updateItems(process.env.INVENTRY_TABLE, items, (item, tableName) => ({
        TableName: tableName,
        Key: {
            itemId: item.itemId, // Partition key
            transactionId: item.transactionId // Sort key
        },
        UpdateExpression: `SET ${Object.keys(item)
            .filter(key => key !== "itemId" && key !== "transactionId") // Exclude primary key attributes
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ExpressionAttributeNames: Object.keys(item)
            .filter(key => key !== "itemId" && key !== "transactionId") // Exclude primary key attributes
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(item)
            .filter(key => key !== "itemId" && key !== "transactionId") // Exclude primary key attributes
            .reduce((acc, key) => {
                acc[`:${key}`] = item[key];
                return acc;
            }, {}),
        ReturnValues: "NONE"
    }));
}
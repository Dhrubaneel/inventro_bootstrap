import { syncCloudData, updateItems } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

export async function syncCloudConfig(lastSync, nextToken = undefined) {
    const params = {
        TableName: process.env.CONFIG_TABLE,
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

export async function upsertCloudConfig(items) {
    return await updateItems(process.env.CONFIG_TABLE, items, (item, tableName) => ({
        TableName: tableName,
        Key: {
            pk: item.pk, // Partition key
            sk: item.sk  // Sort key
        },
        UpdateExpression: `SET ${Object.keys(item)
            .filter(key => key !== "pk" && key !== "sk") // Exclude primary key attributes
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ConditionExpression: "attribute_not_exists(updatedAt) OR updatedAt < :currentUpdatedAt",
        ExpressionAttributeNames: Object.keys(item)
            .filter(key => key !== "pk" && key !== "sk") // Exclude primary key attributes
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(item)
            .filter(key => key !== "pk" && key !== "sk") // Exclude primary key attributes
            .reduce((acc, key) => {
                acc[`:${key}`] = item[key];
                return acc;
            }, { ":currentUpdatedAt": item.updatedAt }),
        ReturnValues: "NONE"
    }));
}
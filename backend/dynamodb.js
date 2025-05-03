import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient, UpdateCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
config({ path: envPath });

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    apiVersion: '2012-08-10'
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export async function syncCloudData(params) {

    const command = new ScanCommand(params);

    try {
        const data = await ddbDocClient.send(command);
        console.log("Scan results:", data.Items);
        return {
            items: data.Items,
            nextToken: data.LastEvaluatedKey ? JSON.stringify(data.LastEvaluatedKey) : null
        };
    } catch (error) {
        console.error("Error scanning DynamoDB:", error);
        throw error;
    }
}

async function upsertCloudData(upsertPromises) {
    try {
        const results = await Promise.allSettled(upsertPromises);
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                console.log(`Item ${index} upserted successfully.`);
            } else {
                console.error(`Error upserting item ${index}:`, result.reason);
            }
        });
        return results;
    } catch (error) {
        console.error("Error upserting items:", error);
        throw error;
    }
}

export async function updateItems(tableName, items, buildParamsFn) {
    const updatePromises = items.map(item => {
        const params = buildParamsFn(item, tableName);
        const command = new UpdateCommand(params);
        return ddbDocClient.send(command);
    });

    return await upsertCloudData(updatePromises);
}

export async function queryCloudData(params) {
    const command = new QueryCommand(params);

    try {
        const data = await ddbDocClient.send(command);
        console.log("Query results:", data.Items);
        return {
            items: data.Items,
            nextToken: data.LastEvaluatedKey ? JSON.stringify(data.LastEvaluatedKey) : null
        };
    } catch (error) {
        console.error("Error querying DynamoDB:", error);
        throw error;
    }
}

export async function deleteCloudData(tableName, items, buildParamsFn) {
    const deletePromises = items.map(item => {
        const params = buildParamsFn(item, tableName);
        const command = new DeleteCommand(params);
        return ddbDocClient.send(command);
    });

    try {
        const results = await Promise.all(deletePromises);
        console.log(`Deleted ${results.length} items successfully.`);
        return results;
    } catch (error) {
        console.error("Error deleting items:", error);
        throw error;
    }
}
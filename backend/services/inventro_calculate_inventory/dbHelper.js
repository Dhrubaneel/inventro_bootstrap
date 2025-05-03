import { queryCloudData, updateItems } from "../../dynamodb.js";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

export async function getAllTransactionsOfAnItemId(pkValue, nextToken = undefined) {
    const params = {
        TableName: process.env.TRANSACTION_TABLE,
        IndexName: 'transaction_by_itemId',
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "attribute_not_exists(#expiredBy)",
        ExpressionAttributeNames: {
            "#pk": "itemId",
            "#expiredBy": "expiredBy"
        },
        ExpressionAttributeValues: {
            ":pkValue": pkValue,
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };

    const result = await queryCloudData(params);

    result.items.sort((a, b) => a.transactionType.localeCompare(b.transactionType));

    return result;
}

export async function getInventoryByItemType(itemType, nextToken = undefined)  {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        IndexName: 'items_by_type',
        KeyConditionExpression: "#pk = :pkValue",
        ExpressionAttributeNames: {
            "#pk": "type"
        },
        ExpressionAttributeValues: {
            ":pkValue": itemType,
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };

    const result = await queryCloudData(params);
    return result;
}

export async function updateItemInventoryStatus(itemId, inventoryStatus) {
    return await updateItems(process.env.INVENTORY_TABLE, [inventoryStatus], (item, tableName) => ({
        TableName: tableName,
        Key: {
            itemId: itemId
        },
        UpdateExpression: `SET ${Object.keys(inventoryStatus)
            .filter(key => key !== "itemId")
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ExpressionAttributeNames: Object.keys(inventoryStatus)
            .filter(key => key !== "itemId")
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(inventoryStatus)
            .filter(key => key !== "itemId")
            .reduce((acc, key) => {
                acc[`:${key}`] = inventoryStatus[key];
                return acc;
            }, {}),
        ReturnValues: "NONE"
    }));
}

export async function updateTTLForOldTransaction(allTransactions) {
    console.log(`Updating TTL for ${allTransactions.length} transactions...`);
    const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
    const eighteenMonthsInSeconds = 18 * 30 * 24 * 60 * 60; // 18 months in seconds (approximation: 30 days per month)
    const ttlValue = currentTimeInSeconds + eighteenMonthsInSeconds; // TTL value 18 months from now

    const updatePromises = allTransactions.map(transaction => {
        const params = {
            TableName: process.env.TRANSACTION_TABLE,
            Key: {
                itemId: transaction.itemId, // Partition key
                transactionId: transaction.transactionId // Sort key
            },
            UpdateExpression: "SET #expiredBy = :expiredBy",
            ExpressionAttributeNames: {
                "#expiredBy": "expiredBy"
            },
            ExpressionAttributeValues: {
                ":expiredBy": ttlValue
            },
            ReturnValues: "NONE"
        };

        return updateItems(process.env.TRANSACTION_TABLE, [transaction], () => params);
    });

    try {
        await Promise.all(updatePromises);
        console.log(`Updated TTL for ${allTransactions.length} transactions.`);
    } catch (error) {
        console.error("Error updating TTL for transactions:", error);
        throw error;
    }
}

export async function getConsumtionByItemType(itemType, nextToken = undefined) {
    // Calculate the timestamp for 1 week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Subtract 7 days
    const oneWeekAgoISO = oneWeekAgo.toISOString(); // Convert to ISO string format

    const params = {
        TableName: process.env.TRANSACTION_TABLE,
        IndexName: 'itemType_by_transaction_type',
        KeyConditionExpression: "#pk = :pkValue AND #sk = :skValue",
        FilterExpression: "#timestamp >= :oneWeekAgo",
        ExpressionAttributeNames: {
            "#pk": "transactionType",
            "#sk": "type",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
            ":pkValue": 'remove',
            ":skValue": itemType,
            ":oneWeekAgo": oneWeekAgoISO
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };

    const result = await queryCloudData(params);
    return result;
}
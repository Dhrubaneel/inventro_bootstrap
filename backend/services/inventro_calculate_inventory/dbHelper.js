import { queryCloudData, updateItems, deleteCloudData } from "../../dynamodb.js";
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

export async function getInventoryByItemType(itemType, nextToken = undefined) {
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

export async function getTransByTypeAndTransType(itemType, transactionType, nextToken = undefined) {
    // Calculate the timestamp for 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); // Subtract 6 months
    const sixMonthsAgoISO = sixMonthsAgo.toISOString(); // Convert to ISO string format

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
            ":pkValue": transactionType,
            ":skValue": itemType,
            ":oneWeekAgo": sixMonthsAgoISO
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };

    const result = await queryCloudData(params);
    return result;
}

export async function updateShopingListTable(itemType, datatype, stockStatus) {
    return await updateItems(process.env.SHOPPING_LIST_TABLE, [stockStatus], (item, tableName) => ({
        TableName: tableName,
        Key: {
            itemType: itemType,
            dataType: datatype
        },
        UpdateExpression: `SET ${Object.keys(stockStatus)
            .filter(key => key !== "itemType")
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ExpressionAttributeNames: Object.keys(stockStatus)
            .filter(key => key !== "itemType")
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(stockStatus)
            .filter(key => key !== "itemType")
            .reduce((acc, key) => {
                acc[`:${key}`] = stockStatus[key];
                return acc;
            }, {}),
        ReturnValues: "NONE"
    }));
}

export async function getItemsToAddInShoppingList(nextToken = undefined) {
    const params = {
        TableName: process.env.SHOPPING_LIST_TABLE,
        IndexName: 'items_by_dataType',
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "#stockStatus IN (:outOfStock, :lowStock)",
        ExpressionAttributeNames: {
            "#pk": "dataType",
            "#stockStatus": "stockStatus"
        },
        ExpressionAttributeValues: {
            ":pkValue": 'inventory',
            ":outOfStock": "Out of Stock",
            ":lowStock": "Low Stock"
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };
    return await queryCloudData(params);
}

export async function getCurrentShoppingList(nextToken = undefined) {
    const params = {
        TableName: process.env.SHOPPING_LIST_TABLE,
        IndexName: 'items_by_dataType',
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "attribute_not_exists(#isManuallyAdded) OR #isManuallyAdded = :isFalse", // Filter for isManuallyAdded
        ExpressionAttributeNames: {
            "#pk": "dataType",
            "#isManuallyAdded": "isManuallyAdded"
        },
        ExpressionAttributeValues: {
            ":pkValue": 'shoppingList',
            ":isFalse": false
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };
    return await queryCloudData(params);
}

export async function removeOldShoppingList(currentShoppingList) {
    try {
        if (!currentShoppingList || currentShoppingList.length === 0) {
            console.log("No items to remove from the shopping list.");
            return;
        }

        // Call deleteCloudData with the current shopping list
        await deleteCloudData(process.env.SHOPPING_LIST_TABLE, currentShoppingList, (item, tableName) => ({
            TableName: tableName,
            Key: {
                itemType: item.itemType,
                dataType: item.dataType
            }
        }));

        console.log(`Removed ${currentShoppingList.length} items from the shopping list.`);
    } catch (error) {
        console.error("Error removing items from the shopping list:", error);
        throw error;
    }
}
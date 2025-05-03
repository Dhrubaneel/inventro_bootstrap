import { queryCloudData, updateItems, deleteCloudData } from "../../dynamodb.js";
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
            "#pk": "dataType",
        },
        ExpressionAttributeValues: {
            ":pkValue": dataType,
        },
        ExclusiveStartKey: nextToken ? JSON.parse(nextToken) : undefined
    };
    return await queryCloudData(params);
}

export async function addCustomShoppingListItem(customItems) {
    return await updateItems(process.env.SHOPPING_LIST_TABLE, customItems, (item, tableName) => ({
        TableName: tableName,
        Key: {
            itemType: item.customItemType, // Partition key
            dataType: 'shoppingList'  // Sort key
        },
        UpdateExpression: `SET ${Object.keys(item)
            .filter(key => key !== "customItemType" && key !== "itemType" && key !== "dataType") // Exclude customItemType and primary key attributes
            .map(key => `#${key} = :${key}`)
            .join(", ")}`,
        ExpressionAttributeNames: Object.keys(item)
            .filter(key => key !== "customItemType" && key !== "itemType" && key !== "dataType") // Exclude customItemType and primary key attributes
            .reduce((acc, key) => {
                acc[`#${key}`] = key;
                return acc;
            }, {}),
        ExpressionAttributeValues: Object.keys(item)
            .filter(key => key !== "customItemType" && key !== "itemType" && key !== "dataType") // Exclude customItemType and primary key attributes
            .reduce((acc, key) => {
                acc[`:${key}`] = item[key];
                return acc;
            }, {}),
        ReturnValues: "NONE"
    }));
}

export async function removeCustomShoppingListItem(customShoppingListItem) {
    try {
        if (!customShoppingListItem || customShoppingListItem.length === 0) {
            console.log("No items to remove from the shopping list.");
            return;
        }

        // Call deleteCloudData with the current shopping list
        return await deleteCloudData(process.env.SHOPPING_LIST_TABLE, customShoppingListItem, (item, tableName) => ({
            TableName: tableName,
            Key: {
                itemType: item.itemType,
                dataType: 'shoppingList'
            }
        }));
    } catch (error) {
        console.error("Error removing items from the shopping list:", error);
        throw error;
    }
}
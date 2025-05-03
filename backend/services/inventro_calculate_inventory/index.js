import { calculateCurrentInventoryStatus, getAllActiveTransactions, getInventoryStatusByItemType, calculateCumulativeInventoryStatus } from "./helper.js";
import { updateItemInventoryStatus, updateTTLForOldTransaction, updateInventoryStockStatus } from "./dbHelper.js";

export const calculateInventory = async (event) => {
    try {
        console.log("Input Event for calculateInventory: ", JSON.stringify(event));

        if (event.eventName == "INSERT") {
            console.log(`Fetching transactions for itemId: ${event.itemId}`);
            const allTransactions = await getAllActiveTransactions(event.itemId);
            if (allTransactions.length === 0) {
                console.log(`No transactions found for itemId: ${event.itemId}`);
                return {};
            }
            const currentInventoryStatus = calculateCurrentInventoryStatus(allTransactions);
            console.log(`Current Inventory Status for : ${event.itemId}`, JSON.stringify(currentInventoryStatus));
            await updateItemInventoryStatus(event.itemId, currentInventoryStatus);
            console.log(`Fetching cumulative inventory status for itemType: ${event.itemType}`);
            const currentInventoryByItemType = await getInventoryStatusByItemType(event.itemType);
            if (currentInventoryByItemType.length === 0) {
                console.log(`No inventory status found for itemType: ${event.itemType}`);
                return {};
            }
            const currentCumulativeItemStatusInInventory = await calculateCumulativeInventoryStatus(event.itemType, currentInventoryByItemType);
            console.log(`Current Cumulative Inventory Status for itemType: ${event.itemType}`, JSON.stringify(currentCumulativeItemStatusInInventory));
            await updateInventoryStockStatus(event.itemType, currentCumulativeItemStatusInInventory);
            if (currentInventoryStatus.quantity <= 0) {
                console.log(`Item ${event.itemId} is out of stock`);
                await updateTTLForOldTransaction(allTransactions);
            }
        } else {
            console.log(`${event.eventName} is not supported`);
        }
        return {};
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
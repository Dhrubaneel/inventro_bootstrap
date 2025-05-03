import { calculateCurrentInventoryStatus, getAllActiveTransactions } from "./helper.js";
import { updateItemInventoryStatus, updateTTLForOldTransaction } from "./dbHelper.js";

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
            updateItemInventoryStatus(event.itemId, currentInventoryStatus);
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
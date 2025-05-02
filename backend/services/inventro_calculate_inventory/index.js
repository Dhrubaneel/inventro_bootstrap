import { getAllTransactionsOfAnItemId } from "./dbHelper.js";

export const calculateInventory = async (event) => {
    try {
        console.log("Input Event for calculateInventory: ", JSON.stringify(event));

        if (["INSERT", "MODIFY"].includes(event.eventName)) {
            console.log(`Fetching transactions for itemId: ${event.itemId}`);
            const allTransactions = await getAllActiveTransactions(event.itemId);
        } else {
            console.log(`${event.eventName} is not supported`);
            return;
        }


        return true;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

const getAllActiveTransactions = async (itemId) => {
    try {
        const transactions = [];
        let nextToken = undefined;
        do {
            const response = await getAllTransactionsOfAnItemId(itemId, nextToken);
            transactions.push(...response.Items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);
        console.log(`Fetched ${transactions.length} transactions for itemId: ${itemId}`);
        return transactions;
    } catch (e) {
        console.error("Error fetching transactions: ", e);
        throw e;
    }
}
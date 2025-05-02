import { getAllTransactionsOfAnItemId } from "./dbHelper.js";

export const getAllActiveTransactions = async (itemId) => {
    try {
        const transactions = [];
        let nextToken = undefined;
        do {
            const response = await getAllTransactionsOfAnItemId(itemId, nextToken);
            transactions.push(...response.items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);
        console.log(`Fetched ${transactions.length} transactions for itemId: ${itemId}`);
        return transactions;
    } catch (e) {
        console.error("Error fetching transactions: ", e);
        throw e;
    }
}

export const calculateCurrentInventoryStatus = (allTransactions) => {
    const firstAddTransaction = allTransactions.find(transaction => transaction.transactionType === "add");
    let itemQuantity = 0;
    const locations = [];
    for (let transaction of allTransactions) {
        itemQuantity += transaction.quantityChanged;
        if (transaction.transactionType === "add") {
            locations.push(transaction.location);
        } else if (transaction.transactionType === "remove" && (!transaction.partialTransaction || itemQuantity === 0)) {
            locations.splice(locations.indexOf(locations.find(item => item === transaction.location)), 1);
        }
    }
    return {
        itemId: firstAddTransaction.itemId,
        itemName: firstAddTransaction.itemName,
        type: firstAddTransaction.type,
        category: firstAddTransaction.category,
        brand: firstAddTransaction.brand,
        quantity: itemQuantity,
        unit: firstAddTransaction.unit,
        locations: calculateItemCount(locations)
    }
}

const calculateItemCount = (items) => {
    const counts = items.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts)
        .map(([key, count]) => (count > 1 ? `${key}(${count})` : key))
        .join(', ');
}
import { getAllTransactionsOfAnItemId, getInventoryByItemType, getConsumtionByItemType } from "./dbHelper.js";

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
        } else if (transaction.transactionType === "remove" && !transaction.partialTransaction) {
            locations.splice(locations.indexOf(locations.find(item => item === transaction.location)), 1);
        }
    }
    if (itemQuantity === 0) {
        locations.length = 0;
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

export const getInventoryStatusByItemType = async (itemType) => {
    try {
        const allInventoryStatus = [];
        let nextToken = undefined;
        do {
            const response = await getInventoryByItemType(itemType, nextToken);
            allInventoryStatus.push(...response.items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);
        console.log(`Fetched ${allInventoryStatus.length} inventory status for itemType: ${itemType}`);
        return allInventoryStatus;
    } catch (e) {
        console.error("Error fetching inventory status: ", e);
        throw e;
    }
}

const calculateMonthlyConsumption = async (itemType) => {
    try {
        const removeTransactions = [];
        let nextToken = undefined;
        do {
            const response = await getConsumtionByItemType(itemType, nextToken);
            removeTransactions.push(...response.items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);
        console.log(`Fetched ${removeTransactions.length} remove transactions for itemType: ${itemType}`);
        let monthlyConsumption = 0;
        if (removeTransactions.length > 0) {
            for (let transaction of removeTransactions) {
                monthlyConsumption -= transaction.quantityChanged;
            }
        }
        return (monthlyConsumption / 6).toFixed(2); // Monthly consumption is calculated based on the last 6 months of transactions
    } catch (e) {
        console.error("Error fetching consumption details: ", e);
        throw e;
    }
}

const stockStatus = (monthlyConsumption, currentInventory) => {
    if (currentInventory <= 0) {
        return "Out of Stock";
    } else if (currentInventory < monthlyConsumption) {
        return "Low Stock";
    } else {
        return "Sufficient";
    }
};

export const calculateCumulativeInventoryStatus = async (itemType, allInventoryStatus) => {
    let totalQuantity = 0;
    const locations = [];
    for (let inventoryStatus of allInventoryStatus) {
        totalQuantity += inventoryStatus.quantity;
        if (inventoryStatus.locations) {
            locations.push(...inventoryStatus.locations.split(", "));
        }
    }
    if (totalQuantity === 0) {
        locations.length = 0;
    }
    const monthlyConsumption = await calculateMonthlyConsumption(itemType);
    return {
        itemType: itemType,
        monthlyConsumption: monthlyConsumption,
        currentInventory: totalQuantity,
        units: allInventoryStatus[0].unit,
        locations: calculateItemCount(locations),
        stockStatus: stockStatus(monthlyConsumption, totalQuantity)
    }
} 
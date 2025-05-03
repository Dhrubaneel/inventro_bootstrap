import { getAllTransactionsOfAnItemId, getInventoryByItemType, getConsumtionByItemType, getCurrentShoppingList, removeOldShoppingList, getItemsToAddInShoppingList } from "./dbHelper.js";

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
        locations: calculateItemLocation(locations)
    }
}

const calculateItemLocation = (items) => {
    const locations = items.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(locations)
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

        // Fetch all remove transactions for the last 6 months
        do {
            const response = await getConsumtionByItemType(itemType, nextToken);
            removeTransactions.push(...response.items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);

        console.log(`Fetched ${removeTransactions.length} remove transactions for itemType: ${itemType}`);

        if (removeTransactions.length === 0) {
            return 0; // No transactions, monthly consumption is 0
        }

        // Group transactions by month
        const transactionsByMonth = removeTransactions.reduce((acc, transaction) => {
            const month = transaction.timestamp.slice(0, 7); // Extract "YYYY-MM" from timestamp
            acc[month] = (acc[month] || 0) - transaction.quantityChanged; // Sum up consumption for the month
            return acc;
        }, {});

        // Calculate total consumption and number of months with transactions
        const totalConsumption = Object.values(transactionsByMonth).reduce((sum, monthlyTotal) => sum + monthlyTotal, 0);
        const numberOfMonths = Object.keys(transactionsByMonth).length;

        // Calculate average monthly consumption
        return Number((totalConsumption / numberOfMonths).toFixed(2));
    } catch (e) {
        console.error("Error fetching consumption details: ", e);
        throw e;
    }
};

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
        locations: calculateItemLocation(locations),
        stockStatus: stockStatus(monthlyConsumption, totalQuantity)
    }
}

export const generateShoppingList = async () => {
    try {
        const currentShoppingList = [];
        let nextToken = undefined;
        do {
            const response = await getCurrentShoppingList(nextToken);
            currentShoppingList.push(...response.items);
            nextToken = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextToken);

        console.log(`Fetched ${currentShoppingList.length} shopping list items from current shopping list`);

        console.log("Remove old shopping list items ...");
        await removeOldShoppingList(currentShoppingList);

        const getLowStockItems = [];
        let nextTokenForStock = undefined;

        do {
            const response = await getItemsToAddInShoppingList(nextTokenForStock);
            getLowStockItems.push(...response.items);
            nextTokenForStock = response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : undefined;
        } while (nextTokenForStock);

        console.log(`Fetched ${getLowStockItems.length} items to add in shopping list`);

        const newShoppingList = prepareShoppingList(getLowStockItems);

        console.log("New shopping list items: ", JSON.stringify(newShoppingList));

    } catch (e) {
        console.error("Error generating shopping list: ", e);
        throw e;
    }
}

const prepareShoppingList = (items) => {
    const shoppingList = items.map(item => {
        return {
            itemType: item.itemType,
            dataType: "shoppingList",
            quantity: Number(item.monthlyConsumption - item.currentInventory),
            units: item.units,
            preferredSupplier:"",
            preferredBrand:""
        };
    });
    return shoppingList;
}
import { syncCloudShoppingList, addCustomShoppingListItem, removeCustomShoppingListItem } from './dbHelper.js';
import { Validator } from "jsonschema";
import { fetchInventorySchema, addCustomShoppingItemSchema, removeCustomShoppingItemSchema } from "../../schema.js";

export const syncInventoryList = async (event) => {
    try {
        console.log("Input Event for syncInventoryList: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, fetchInventorySchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        let scannedItems = await syncCloudShoppingList('inventory', event.nextToken);
        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

export const syncShoppingList = async (event) => {
    try {
        console.log("Input Event for syncShoppingList: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, fetchInventorySchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        let scannedItems = await syncCloudShoppingList('shoppingList', event.nextToken);
        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

export const addCustomShoppingItem = async (event) => {
    try {
        console.log("Input Event for addCustomShoppingItem: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, addCustomShoppingItemSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        // Add isManuallyAdded: true to each object in the event array
        event.forEach(item => {
            item.isManuallyAdded = true;
        });
        return await addCustomShoppingListItem(event);
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

export const removeCustomShoppingItem = async (event) => {
    try { 
        console.log("Input Event for removeCustomShoppingItem: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, removeCustomShoppingItemSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        return await removeCustomShoppingListItem(event);
    }
    catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
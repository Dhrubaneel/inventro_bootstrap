import { syncCloudShoppingList } from './dbHelper.js';
import { Validator } from "jsonschema";
import { fetchInventorySchema } from "../../schema.js";

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

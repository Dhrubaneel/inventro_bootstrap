import { Validator } from "jsonschema";
import { fetchInventorySchema } from "../../schema.js";
import { fetchCloudInventory } from "./dbHelper.js";

export const fetchInventory = async (event) => {
    try {
        console.log("Input Event for fetchInventory: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, fetchInventorySchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        let scannedItems = await fetchCloudInventory(event.nextToken);

        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
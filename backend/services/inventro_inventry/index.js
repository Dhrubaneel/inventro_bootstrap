import { Validator } from "jsonschema";
import { syncSchema } from "../../schema.js";
import {syncCloudInventory} from "./dbHelper.js";

export const syncInventry = async (event) => {
    try {
        console.log("Input Event for syncInventry: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, syncSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        let scannedItems = await syncCloudInventory(event.lastSync, event.nextToken);

        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
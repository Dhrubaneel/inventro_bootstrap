import { Validator } from "jsonschema";
import { syncSchema, updateConfigSchema } from "../../schema.js";
import { syncCloudConfig, upsertCloudConfig } from "./dbHelper.js";

export const syncConfig = async (event) => {
    try {
        console.log("Input Event for syncConfig: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, syncSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        let scannedItems = await syncCloudConfig(event.lastSync, event.nextToken);

        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

export const upsertConfig = async (event) => {
    try {
        console.log("Input Event for updateConfig: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, updateConfigSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        return await upsertCloudConfig(event);
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
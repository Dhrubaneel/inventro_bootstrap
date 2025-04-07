import { Validator } from "jsonschema";
import { syncSchema, updateInventrySchema } from "../../schema.js";
import { syncCloudInventory, upsertCloudInventory } from "./dbHelper.js";

export const upsertInventry = async (event) => {
    try {
        console.log("Input Event for updateInventry: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, updateInventrySchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        return await upsertCloudInventory(event);
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
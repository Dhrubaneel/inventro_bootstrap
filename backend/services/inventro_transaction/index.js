import { Validator } from "jsonschema";
import { updateTransactionSchema } from "../../schema.js";
import { updateCloudTransaction } from "./dbHelper.js";

export const updateTransaction = async (event) => {
    try {
        console.log("Input Event for updateTransaction: ", JSON.stringify(event));
        // Validate the event against the schema
        const validationResult = new Validator().validate(event, updateTransactionSchema);
        if (!validationResult.valid) {
            console.error("Validation errors:", validationResult.errors);
            throw new Error(validationResult.errors);
        }
        return await updateCloudTransaction(event);
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
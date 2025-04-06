export class LambdaFramework {
    constructor() {
        this.handlers = new Map();
    }

    subscribeHandler(action, handler) {
        if (!action || typeof handler !== 'function') {
            throw new Error("Invalid action or handler");
        }
        this.handlers.set(action, handler);
        console.log(`Handler subscribed: ${action}`);
    }

    async invoke(event) {
        try {
            const { action, data } = event || {};
            console.log("Received event:", JSON.stringify(event));

            const handler = this.handlers.get(action);
            if (!handler) {
                throw new Error(`No handler found for action: ${action}`);
            }

            const response = await handler(data);
            console.log("Lambda response:", JSON.stringify(response));
            return response;
        } catch (error) {
            console.error("Error invoking Lambda:", error);
            throw error;
        }
    }
}

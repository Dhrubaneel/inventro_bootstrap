import {syncCloudShoppingList} from './dbHelper.js';

export const syncShoppingList = async (event) => {
    try {
        console.log("Input Event for syncShoppingList: ", JSON.stringify(event));
        let scannedItems = await syncCloudShoppingList(event.nextToken);
        return scannedItems;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}

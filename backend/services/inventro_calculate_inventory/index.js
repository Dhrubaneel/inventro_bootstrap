export const calculateInventory = async (event) => {   
    try {
        console.log("Input Event for calculateInventory: ", JSON.stringify(event));


        return true;
    } catch (e) {
        console.error("Error: ", e);
        throw e;
    }
}
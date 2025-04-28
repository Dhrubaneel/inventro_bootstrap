import { LambdaFramework } from './framework.js';
import { syncConfig, upsertConfig } from './services/inventro_config/index.js';
import { updateTransaction } from './services/inventro_transaction/index.js';
import { fetchInventory } from './services/inventro_inventory/index.js';

const objFramework = new LambdaFramework();

objFramework.subscribeHandler('syncConfig', syncConfig);
objFramework.subscribeHandler('upsertConfig', upsertConfig);
objFramework.subscribeHandler('updateTransaction', updateTransaction);
objFramework.subscribeHandler('fetchInventory', fetchInventory);

const handler = objFramework.invoke.bind(objFramework);

export { handler };
import { LambdaFramework } from './framework.js';
import { syncConfig, upsertConfig } from './services/inventro_config/index.js';
import { updateInventry } from './services/inventro_inventry/index.js';

const objFramework = new LambdaFramework();

objFramework.subscribeHandler('syncConfig', syncConfig);
objFramework.subscribeHandler('upsertConfig', upsertConfig);
objFramework.subscribeHandler('updateInventry', updateInventry);

const handler = objFramework.invoke.bind(objFramework);

export { handler };
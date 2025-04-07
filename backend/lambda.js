import { LambdaFramework } from './framework.js';
import { syncConfig, upsertConfig } from './services/inventro_config/index.js';
import { upsertInventry } from './services/inventro_inventry/index.js';

const objFramework = new LambdaFramework();

objFramework.subscribeHandler('syncConfig', syncConfig);
objFramework.subscribeHandler('upsertConfig', upsertConfig);
objFramework.subscribeHandler('upsertInventry', upsertInventry);

const handler = objFramework.invoke.bind(objFramework);

export { handler };
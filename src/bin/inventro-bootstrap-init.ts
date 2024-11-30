#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InventroBootstrapInitStack } from '../lib/inventro-bootstrap-init-stack';

const app = new cdk.App();
new InventroBootstrapInitStack(app, 'InventroBootstrapInitStack', {
  env: { account: '137436588653', region: 'ap-south-1' }
});
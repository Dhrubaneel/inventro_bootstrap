import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Table } from './dynamodb/tables';
import { ApiGateway } from './apiGateway/api';
import { INVENTRO_CONFIG, INVENTRO_INVENTRY, INVENTRO_SHOPPING_LIST, INVENTRO_API } from './constants';

export class InventroBootstrapInitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config_table = new Table(this, 'InventroConfig', {
      tableName: INVENTRO_CONFIG,
      partitionKey: 'pk',
      sortKey: 'sk'
    });

    const inventry_table = new Table(this, 'InventroInventry', {
      tableName: INVENTRO_INVENTRY,
      partitionKey: 'itemId',
      sortKey: 'transactionId',
      globalSecondaryIndexes: [
        {
          indexName: 'items_by_type',
          partitionKey: {
            name: 'type',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_category',
          partitionKey: {
            name: 'category',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemName',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_supplier_and_brand',
          partitionKey: {
            name: 'supplier',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'brand',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_location',
          partitionKey: {
            name: 'location',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_transaction_type',
          partitionKey: {
            name: 'transactionType',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        }
      ]
    });

    const shopping_list_table = new Table(this, 'InventroShoppingList', {
      tableName: INVENTRO_SHOPPING_LIST,
      partitionKey: 'itemType',
      sortKey: 'dataType',
      globalSecondaryIndexes: [
        {
          indexName: 'items_by_stock_status',
          partitionKey: {
            name: 'stockStatus',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemType',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_transaction_type',
          partitionKey: {
            name: 'inShoppingList',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemType',
            type: dynamodb.AttributeType.STRING
          }
        }
      ]
    });

    const inventro_api = new ApiGateway(this, 'InventroApi', {
      apiName: INVENTRO_API,
      description: 'API for Inventro application',
      stageName: 'prod',
      cors: true
    });

    //assign resource tags
    addTagsToResources(
      [config_table, inventry_table, shopping_list_table, inventro_api],
      { 'Project': 'Inventro' }
    );
  }
}

function addTagsToResources(resources: Construct[], tags: { [key: string]: string }) {
  resources.forEach(resource => {
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(resource).add(key, value);
    });
  });
}

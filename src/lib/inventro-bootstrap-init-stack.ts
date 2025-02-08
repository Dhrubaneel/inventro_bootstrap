import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table } from './dynamodb/tables';
import { INVENTROCONFIG, INVENTROINVENTRY, INVENTROROLE, INVENTROSHOPPINGLIST, INVENTROTRANSACTION } from './constants';
import { IamRole } from './iam/iam';

export class InventroBootstrapInitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const inventro_role = new IamRole(this, 'InventroRole', {
      roleName: INVENTROROLE,
      servicePrincipals: ['amplify.amazonaws.com'],
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
      ]
    });

    const config_table = new Table(this, 'InventroConfig', {
      tableName: INVENTROCONFIG,
      partitionKey: 'pk',
      sortKey: 'sk'
    });

    const inventry_table = new Table(this, 'InventroInventry', {
      tableName: INVENTROINVENTRY,
      partitionKey: 'itemId',
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
          indexName: 'items_by_expiery',
          partitionKey: {
            name: 'expiresOn',
            type: dynamodb.AttributeType.NUMBER
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'items_by_location',
          partitionKey: {
            name: 'location',
            type: dynamodb.AttributeType.NUMBER
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        }
      ]
    });

    const transaction_table = new Table(this, 'InventroTransaction', {
      tableName: INVENTROTRANSACTION,
      partitionKey: 'transactionId',
      globalSecondaryIndexes: [
        {
          indexName: 'items_by_itemid',
          partitionKey: {
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
            name: 'timestamp',
            type: dynamodb.AttributeType.NUMBER
          }
        }
      ]
    });

    const shopping_list_table = new Table(this, 'InventroShoppingList', {
      tableName: INVENTROSHOPPINGLIST,
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

    //assign resource tags
    addTagsToResources(
      [inventro_role, config_table, inventry_table, transaction_table, shopping_list_table],
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

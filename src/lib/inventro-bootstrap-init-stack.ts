import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Table } from './dynamodb/tables';
import { ApiGateway } from './apiGateway/api';
import { LambdaFunction } from './lambda/lambda';
import { Pipe } from './eventbridge/pipe';
import { INVENTRO_CONFIG, INVENTRO_INVENTORY, INVENTRO_SHOPPING_LIST, INVENTRO_API, INVENTRO_SERVICE, INVENTRO_SERVICE_TIMEOUT, INVENTRO_SERVICE_ROLE, INVENTRO_CONFIG_ENDPOINT, INVENTRO_TRANSACTION_ENDPOINT, INVENTRO_CONFIG_ENDPOINT_PATH_SYNC, INVENTRO_CONFIG_ENDPOINT_PATH_UPSERT, INVENTRO_TRANSACTION_ENDPOINT_PATH_UPDATE, INVENTRO_TRANSACTION, INVENTRO_INVENTORY_ENDPOINT, INVENTRO_INVENTORY_ENDPOINT_PATH_FETCH, INVENTRO_EVENTBRIDGE_PIPE_ROLE, INVENTRO_EVENTBRIDGE_TRANSACTION_TABLE_PIPE, INVENTRO_CALCULATE_ENDPOINT, INVENTRO_CALCULATE_ENDPOINT_PATH_INVENTORY } from './constants';
import { IamRole } from './iam/iam';
import { ApiResource } from './apiGateway/api-resource';
import { Function } from 'aws-cdk-lib/aws-lambda';

export class InventroBootstrapInitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config_table = new Table(this, 'InventroConfig', {
      tableName: INVENTRO_CONFIG,
      partitionKey: 'pk',
      sortKey: 'sk'
    });

    const inventory_table = new Table(this, 'InventroInventory', {
      tableName: INVENTRO_INVENTORY,
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
          indexName: 'items_by_location',
          partitionKey: {
            name: 'location',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        }
      ]
    });

    const transaction_table = new Table(this, 'InventroTransaction', {
      tableName: INVENTRO_TRANSACTION,
      partitionKey: 'transactionId',
      sortKey: 'itemId',
      globalSecondaryIndexes: [
        {
          indexName: 'itemType_by_transaction_type',
          partitionKey: {
            name: 'transactionType',
            type: dynamodb.AttributeType.STRING
          },
          sortKey: {
            name: 'type',
            type: dynamodb.AttributeType.STRING
          }
        },
        {
          indexName: 'transaction_by_itemId',
          partitionKey: {
            name: 'itemId',
            type: dynamodb.AttributeType.STRING
          }
        }
      ],
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      ttlAttributeName: 'expiredBy'
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
      cors: false
    });

    const inventro_service_role = new IamRole(this, 'InventroServiceRole', {
      roleName: INVENTRO_SERVICE_ROLE,
      roleDescription: 'Role for Inventro service to access DynamoDB and other resources',
      servicePrincipals: ['lambda.amazonaws.com'],
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });

    const inventro_service = new LambdaFunction(this, 'InventroService', {
      functionName: INVENTRO_SERVICE,
      handler: 'lambda.handler',
      codePath: './artefact',
      timeout: cdk.Duration.seconds(INVENTRO_SERVICE_TIMEOUT),
      description: 'Inventro lambda function to manage all the operations',
      role: inventro_service_role.role,
    });

    const inventro_eventbridge_pipe_role = new IamRole(this, 'InventroEventBridgePipeRole', {
      roleName: INVENTRO_EVENTBRIDGE_PIPE_ROLE,
      roleDescription: 'Role for Inventro Eventbridge Pipe that listens to transaction_table DynamoDB stream',
      servicePrincipals: ['pipes.amazonaws.com'],
      inlinePolicies: [
        new iam.PolicyStatement({
          actions: [
            'dynamodb:DescribeStream',
            'dynamodb:GetRecords',
            'dynamodb:GetShardIterator',
            'dynamodb:ListStreams'
          ],
          resources: [transaction_table.table.tableStreamArn!],
        }),
        new iam.PolicyStatement({
          actions: [
            'execute-api:Invoke',
            'execute-api:ManageConnections'
          ],
          resources: [inventro_api.restApi.arnForExecuteApi()],
        })
      ]
    });

    const inventro_config_api_resource = inventro_api.restApi.root.addResource(INVENTRO_CONFIG_ENDPOINT);

    const inventro_config_api_resource_sync_method = new ApiResource(this, 'InventroConfigApiResourceSyncMethod', {
      restApi: inventro_api.restApi,
      parentResource: inventro_config_api_resource,
      resourcePath: INVENTRO_CONFIG_ENDPOINT_PATH_SYNC,
      lambdaFunction: inventro_service.function,
      httpMethod: 'POST',
      requestTemplate: generateRequestTemplate('syncConfig'),
      integrationResponses: getDefaultIntegrationResponses(),
      methodResponses: getDefaultMethodResponses()
    });

    const inventro_config_api_resource_upsert_method = new ApiResource(this, 'InventroConfigApiResourceUpsertMethod', {
      restApi: inventro_api.restApi,
      parentResource: inventro_config_api_resource,
      resourcePath: INVENTRO_CONFIG_ENDPOINT_PATH_UPSERT,
      lambdaFunction: inventro_service.function,
      httpMethod: 'POST',
      requestTemplate: generateRequestTemplate('upsertConfig'),
      integrationResponses: getDefaultIntegrationResponses(),
      methodResponses: getDefaultMethodResponses()
    });

    const inventro_transaction_api_resource = inventro_api.restApi.root.addResource(INVENTRO_TRANSACTION_ENDPOINT);

    const inventro_transaction_api_resource_update_method = new ApiResource(this, 'InventroTransactionApiResourceUpdateMethod', {
      restApi: inventro_api.restApi,
      parentResource: inventro_transaction_api_resource,
      resourcePath: INVENTRO_TRANSACTION_ENDPOINT_PATH_UPDATE,
      lambdaFunction: inventro_service.function,
      httpMethod: 'POST',
      requestTemplate: generateRequestTemplate('updateTransaction'),
      integrationResponses: getDefaultIntegrationResponses(),
      methodResponses: getDefaultMethodResponses()
    });

    const inventro_inventory_api_resource = inventro_api.restApi.root.addResource(INVENTRO_INVENTORY_ENDPOINT);

    const inventro_inventory_api_resource_fetch_method = new ApiResource(this, 'InventroInventoryApiResourceFetchMethod', {
      restApi: inventro_api.restApi,
      parentResource: inventro_inventory_api_resource,
      resourcePath: INVENTRO_INVENTORY_ENDPOINT_PATH_FETCH,
      lambdaFunction: inventro_service.function,
      httpMethod: 'POST',
      requestTemplate: generateRequestTemplate('fetchInventory'),
      integrationResponses: getDefaultIntegrationResponses(),
      methodResponses: getDefaultMethodResponses()
    });

    const inventro_calculate_api_resource = inventro_api.restApi.root.addResource(INVENTRO_CALCULATE_ENDPOINT);

    const inventro_calculate_api_resource_inventory_method = new ApiResource(this, 'InventroCalculateApiResourceInventoryMethod', {
      restApi: inventro_api.restApi,
      parentResource: inventro_calculate_api_resource,
      resourcePath: INVENTRO_CALCULATE_ENDPOINT_PATH_INVENTORY,
      lambdaFunction: inventro_service.function,
      httpMethod: 'POST',
      requestTemplate: {
        "application/json": `
          #set($inputRoot = $input.path('$'))
          {
            "action": "calculateInventory",
            "data": {
              "eventName": "$inputRoot.eventName",
              "transactionId": "$inputRoot.dynamodb.NewImage.transactionId.S",
              "itemId": "$inputRoot.dynamodb.NewImage.itemId.S",
              "transactionType": "$inputRoot.dynamodb.NewImage.transactionType.S",
              "itemType": "$inputRoot.dynamodb.NewImage.type.S"
            }
          }
        `
      },
      integrationResponses: getDefaultIntegrationResponses(),
      methodResponses: getDefaultMethodResponses()
    });

    const inventro_transaction_pipe = new Pipe(this, 'InventroTransactionPipe', {
      pipeName: INVENTRO_EVENTBRIDGE_TRANSACTION_TABLE_PIPE,
      sourceStreamArn: transaction_table.table.tableStreamArn!,
      targetApiUrl: inventro_api.restApi.arnForExecuteApi('POST', '/calculate/inventory', 'prod'),
      role: inventro_eventbridge_pipe_role.role
    });

    //assign resource tags
    addTagsToResources(
      [
        config_table,
        inventory_table,
        transaction_table,
        shopping_list_table,
        inventro_api,
        inventro_service,
        inventro_service_role,
        inventro_eventbridge_pipe_role,
        inventro_config_api_resource,
        inventro_inventory_api_resource,
        inventro_transaction_api_resource,
        inventro_config_api_resource_sync_method,
        inventro_config_api_resource_upsert_method,
        inventro_transaction_api_resource_update_method,
        inventro_inventory_api_resource_fetch_method,
        inventro_transaction_pipe,
        inventro_calculate_api_resource,
        inventro_calculate_api_resource_inventory_method
      ],
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

function getDefaultIntegrationResponses(): apigateway.IntegrationResponse[] {
  return [
    {
      statusCode: "200",
      selectionPattern: ".*",
      responseTemplates: {
        "application/json": "$input.body"
      }
    },
    {
      statusCode: "400",
      selectionPattern: ".*\\[400\\].*",
      responseTemplates: {
        "application/json": `{"message": "Client error"}`
      }
    },
    {
      statusCode: "500",
      selectionPattern: ".*",
      responseTemplates: {
        "application/json": `{"message": "Server error"}`
      }
    }
  ];
}

function getDefaultMethodResponses(): apigateway.MethodResponse[] {
  return [
    {
      statusCode: "200",
      responseModels: {
        "application/json": apigateway.Model.EMPTY_MODEL
      }
    }
  ];
}

function generateRequestTemplate(action: string): { [contentType: string]: string } {
  return {
    "application/json": `{
      "action": "${action}",
      "data": $input.json('$')
    }`
  };
}

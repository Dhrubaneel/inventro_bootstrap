import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Table extends Construct {

  public readonly table: dynamodb.TableV2;
  constructor(scope: Construct, id: string, props: DynamoDBTableProps) {
    super(scope, id);

    this.table = new dynamodb.TableV2(this, "Table", {
      tableName: props?.tableName,
      tableClass: dynamodb.TableClass.STANDARD,
      partitionKey: { name: props?.partitionKey, type: dynamodb.AttributeType.STRING },
      sortKey: props?.sortKey ? { name: props.sortKey, type: dynamodb.AttributeType.STRING } : undefined,
      globalSecondaryIndexes: props?.globalSecondaryIndexes,
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
  }
}

export interface DynamoDBTableProps {
  tableName: string;
  partitionKey: string;
  sortKey?: string;  
  globalSecondaryIndexes?: dynamodb.GlobalSecondaryIndexPropsV2[]
}
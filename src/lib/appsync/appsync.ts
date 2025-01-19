import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AppSyncApi extends Construct {

    public readonly api: appsync.GraphqlApi;
    public readonly dataSource: appsync.CfnDataSource;
    public readonly role: iam.Role;
    constructor(scope: Construct, id: string, props: AppSyncApiProps) {
        super(scope, id);

        this.api = new appsync.GraphqlApi(this, "GraphQLApi", {
            name: `${props?.name}_api`,
            schema: appsync.SchemaFile.fromAsset(props.schemaPath),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,
                    apiKeyConfig: {
                        expires: cdk.Expiration.after(cdk.Duration.days(365))
                    }
                }
            }
        });

        this.role = new iam.Role(this, "AppSyncRole", {
            assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSAppSyncPushToCloudWatchLogs"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonDynamoDBFullAccess")
            ]
        });

        this.dataSource = new appsync.CfnDataSource(this, "GraphQLApiDataSource", {
            apiId: this.api.apiId,
            name: `${props?.name}_data_source`,
            type: "AMAZON_DYNAMODB",
            serviceRoleArn: this.role.roleArn,
            dynamoDbConfig: {
                tableName: `${props?.name}`,
                awsRegion: cdk.Stack.of(this).region
            }
        });
    }
}

export interface AppSyncApiProps {
    name: string;
    schemaPath: string;
}
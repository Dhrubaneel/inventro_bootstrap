import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';

export class AppSyncApi extends Construct {

    public readonly api: appsync.GraphqlApi;
    public readonly dataSource: appsync.CfnDataSource;
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

        this.dataSource = new appsync.CfnDataSource(this, "GraphQLApiDataSource", {
            apiId: this.api.apiId,
            name: `${props?.name}_data_source`,
            type: "AMAZON_DYNAMODB",
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
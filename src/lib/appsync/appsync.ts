import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';

export class AppSyncApi extends Construct {

    public readonly api: appsync.GraphqlApi;
    public readonly dataSource: appsync.DynamoDbDataSource;
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

        this.dataSource = new appsync.DynamoDbDataSource(this, "GraphQLApiDataSource", {
            api: this.api,
            table: cdk.aws_dynamodb.Table.fromTableArn(this, "ImportedTable", props.tableArn),
            name: `${props?.name}_datasource`,
            description: "DynamoDB Table Data Source",
            serviceRole: cdk.aws_iam.Role.fromRoleArn(this, "ImportedRole", props.role)
        });

        this.dataSource.createResolver("GetAllConfigResolver", {
            typeName: "Query",
            fieldName: "getAllConfig",
            requestMappingTemplate: appsync.MappingTemplate.fromFile(`${props.requestVTLPath}`),
            responseMappingTemplate: appsync.MappingTemplate.fromFile(`${props.responseVTLPath}`),
        });

        this.dataSource.createResolver("AddConfigResolver", {
            typeName: "Mutation",
            fieldName: "addConfig",
            requestMappingTemplate: appsync.MappingTemplate.fromFile(`${props.requestVTLPath1}`),
            responseMappingTemplate: appsync.MappingTemplate.fromFile(`${props.responseVTLPath}`),
        });
    }
}

export interface AppSyncApiProps {
    name: string;
    schemaPath: string;
    tableArn: string;
    role: string;
    requestVTLPath: string;
    responseVTLPath: string;
    requestVTLPath1: string;
}
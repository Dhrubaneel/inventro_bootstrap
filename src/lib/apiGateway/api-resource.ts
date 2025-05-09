import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface ApiResourceProps {
    restApi: apigateway.RestApi;
    parentResource?: apigateway.IResource;
    resourcePath: string;
    lambdaFunction: lambda.IFunction;
    httpMethod: string;
    requestTemplate?: { [contentType: string]: string };
    integrationResponses?: apigateway.IntegrationResponse[];
    methodResponses?: apigateway.MethodResponse[];
}

export class ApiResource extends Construct {
    constructor(scope: Construct, id: string, props: ApiResourceProps) {
        super(scope, id);

        const parent = props.parentResource ?? props.restApi.root;
        const resource = parent.addResource(props.resourcePath);

        // Lambda Integration
        const lambdaIntegration = new apigateway.LambdaIntegration(props.lambdaFunction, {
            proxy: false,
            requestTemplates: props.requestTemplate,
            integrationResponses: props.integrationResponses ?? [
                {
                    statusCode: "200",
                    responseTemplates: {
                        "application/json": JSON.stringify({ message: "Success" }),
                    },
                },
            ],
        });

        // Add Method
        resource.addMethod(props.httpMethod, lambdaIntegration, {
            methodResponses: props.methodResponses ?? [
                {
                    statusCode: "200",
                    responseModels: {
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                },
            ],
        });

        // Enable CORS
        resource.addCorsPreflight({
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: [props.httpMethod],
        });
    }
}

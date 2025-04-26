import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiGateway extends Construct {

  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.restApi = new apigateway.RestApi(this, "ApiGateway", {
      restApiName: props.apiName,
      description: props.description,
      deployOptions: {
        stageName: props.stageName || 'prod',
      },
      defaultCorsPreflightOptions: props.cors
        ? {
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
          }
        : undefined,
    });
  }
}

export interface ApiGatewayProps {
  apiName: string;
  description?: string;
  stageName?: string;
  cors?: boolean;
}

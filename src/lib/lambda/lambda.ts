import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class LambdaFunction extends Construct {

  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    this.function = new lambda.Function(this, 'LambdaFunction', {
      functionName: props.functionName,
      runtime: props.runtime || lambda.Runtime.NODEJS_22_X, // default runtime if not passed
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      environment: props.environment,
      memorySize: props.memorySize ?? 256,
      timeout: props.timeout ?? cdk.Duration.seconds(10),
      description: props.description,
      role: props.role,
    });
  }
}

export interface LambdaFunctionProps {
  functionName: string;
  handler: string;
  codePath: string;
  runtime?: lambda.Runtime;
  environment?: { [key: string]: string };
  memorySize?: number;
  timeout?: cdk.Duration;
  description?: string;
  role?: iam.IRole;
}

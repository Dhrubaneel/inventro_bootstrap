import { Construct } from 'constructs';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface PipeProps {
  pipeName: string;
  sourceStreamArn: string;
  targetLambdaArn: string;
  role: iam.IRole;
  inputTemplate: string; 
}

export class Pipe extends Construct {
  public readonly pipe: pipes.CfnPipe;

  constructor(scope: Construct, id: string, props: PipeProps) {
    super(scope, id);

    this.pipe = new pipes.CfnPipe(this, 'InventroPipe', {
      name: props.pipeName,
      roleArn: props.role.roleArn,
      source: props.sourceStreamArn,
      target: props.targetLambdaArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 1,
          maximumBatchingWindowInSeconds: 1,
        }
      },
      targetParameters: {
        inputTemplate: props.inputTemplate 
      }
    });
  }
}

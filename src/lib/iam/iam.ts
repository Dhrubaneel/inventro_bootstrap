import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IamRoleProps {
  roleName: string;
  roleDescription: string;
  servicePrincipals: string[];
  managedPolicies?: iam.IManagedPolicy[]; // optional now
  inlinePolicies?: iam.PolicyStatement[]; // new: optional array of custom policy statements
}

export class IamRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: IamRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, "InventroProjectRole", {
      roleName: props.roleName,
      description: props.roleDescription,
      assumedBy: new iam.CompositePrincipal(
        ...props.servicePrincipals.map(sp => new iam.ServicePrincipal(sp))
      ),
      managedPolicies: props.managedPolicies,
    });

    // Add inline policies if provided
    if (props.inlinePolicies) {
      props.inlinePolicies.forEach(policy => {
        this.role.addToPolicy(policy);
      });
    }
  }
}

import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';


export class IamRole extends Construct {

    public readonly role: iam.Role;
    constructor(scope: Construct, id: string, props: IamRoleProps) {
        super(scope, id);

        this.role = new iam.Role(this, "InventroProjectRole", {
            roleName: props?.roleName,
            description: props?.roleDescription,
            assumedBy: new iam.CompositePrincipal(
                ...props.servicePrincipals.map(sp => new iam.ServicePrincipal(sp))
            ),
            managedPolicies: props?.managedPolicies
        });
    }
}

export interface IamRoleProps {
    roleName: string;
    roleDescription: string;
    servicePrincipals: string[];
    managedPolicies: iam.IManagedPolicy[]
}
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_eks as eks } from 'aws-cdk-lib';

export class MmtEksStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const contextEnv = this.node.tryGetContext('environment');
    const env = this.node.tryGetContext("ENV");

    const EKSSUBNETS = contextEnv[env].ekssubnets;
    const NODESUBNETS = contextEnv[env].nodesubnets;
    const ACCOUNT = contextEnv[env].account;

    const cfnCluster = new eks.CfnCluster(this, 'MyCfnCluster', {
      resourcesVpcConfig: {
        subnetIds: EKSSUBNETS,
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        securityGroupIds: ['sg-0e38896b1ce48a778'],
      },
      roleArn: `arn:aws:iam::${ACCOUNT}:role/eksClusterRole`,

      // kubernetesNetworkConfig: {
      //   serviceIpv4Cidr: "172.16.0.0/12"
      // },
      name: 'eks-demo-2',
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
      // version: 'version',
    });

    const kubeproxyCfnAddon = new eks.CfnAddon(this, 'MyCfnAddon', {
      addonName: 'kube-proxy',
      clusterName: cfnCluster.name!,
      serviceAccountRoleArn: `arn:aws:iam::${ACCOUNT}:role/aws-service-role/eks.amazonaws.com/AWSServiceRoleForAmazonEKS`,
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
    });
    kubeproxyCfnAddon.addDependsOn(cfnCluster);

    const cfnNodegroup = new eks.CfnNodegroup(this, 'MyCfnNodegroup', {
      // const cfnNodegroupProps: eks.CfnNodegroupProps = {
      clusterName: cfnCluster.name!,
      nodeRole: `arn:aws:iam::${ACCOUNT}:role/aws-service-role/eks-nodegroup.amazonaws.com/AWSServiceRoleForAmazonEKSNodegroup`,
      subnets: NODESUBNETS,

      // the properties below are optional
      amiType: 'AL2_x86_64',
      // capacityType: 'capacityType',
      // diskSize: 123,
      // forceUpdateEnabled: false,
      instanceTypes: ['t3a.medium'],
      nodegroupName: 'eks-nodegroup-02',
      // releaseVersion: 'releaseVersion',
      remoteAccess: {
        ec2SshKey: 'key-moments-aps1-int',

        // the properties below are optional
        sourceSecurityGroups: ['sg-0e38896b1ce48a778'],
      },
      scalingConfig: {
        desiredSize: 1,
        maxSize: 3,
        minSize: 1,
      },
      // version: 'version',
    });
    cfnNodegroup.addDependsOn(cfnCluster);
  }
}

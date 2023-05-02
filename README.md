# lulo stack properties

lulo stack properties is a plugin for lulo.
Given a CloudFormation StackName or StackID it responds with the Parameters, Outputs and Resources of the Stack.

# Installation
```
$ npm install lulo-plugin-stack-properties --save
```

## Usage
### Properties
* `StackName`: Name or ID of the Stack you want to describe. Required

### Return Values
The resource will return every Parameter, Output and Resource of the stack.
Each return value can be access using the intrinsic function `"Fn::GetAtt"`.

#### Parameters
`{ "Fn::GetAtt: ["ResourceName", "Parameter.{ParameterKey}] }"`
Gives PropertyValue

#### Outputs
`{ "Fn::GetAtt: ["ResourceName", "Output.{OutputKey}] }"`
Gives OutputValue

#### Resources
`{ "Fn::GetAtt: ["ResourceName", "Resources.{ResourceLogicalId}] }"`
Gives ResourcePhysicalId

### Required IAM Permissions
The Custom Resource Lambda requires the following permissions for this plugin to work:
```yaml
Sid: 'LuloPluginStackProperties'
Action:
    - 'cloudformation:DescribeStacks'
    - 'cloudformation:DescribeStackResources'
Effect: 'Allow'
Resource: '*'
```

## License
[The MIT License (MIT)](/LICENSE)

## Change Log
[Change Log](/CHANGELOG.md)

import { DescribeStacksCommand, CloudFormationClient, Stack, DescribeStackResourcesCommand, StackResource } from '@aws-sdk/client-cloudformation';
import {
    CloudFormationCustomResourceCreateEvent,
    CloudFormationCustomResourceDeleteEvent,
    CloudFormationCustomResourceEvent,
    CloudFormationCustomResourceUpdateEvent,
    Context,
} from 'aws-lambda';

const client = new CloudFormationClient({});

export async function validateEvent(event: CloudFormationCustomResourceEvent) {
    if (!event.ResourceProperties.StackName) {
        throw new Error('Missing required property StackName');
    }
}

export async function createResource(event: CloudFormationCustomResourceCreateEvent, _context: Partial<Context>) {
    const [stack, resources] = await Promise.all([
        _describeStack(event.ResourceProperties.StackName),
        _describeStackResources(event.ResourceProperties.StackName),
    ]);

    const pluginResponse: Map<string, string | undefined> = new Map();

    if (stack.Parameters) {
        for (const parameter of stack.Parameters) {
            pluginResponse.set(`Parameter.${parameter.ParameterKey}`, parameter.ParameterValue);
        }
    }

    if (stack.Outputs) {
        for (const output of stack.Outputs) {
            pluginResponse.set(`Output.${output.OutputKey}`, output.OutputValue);
        }
    }

    for (const resource of resources) {
        pluginResponse.set(`Resource.${resource.LogicalResourceId}`, resource.PhysicalResourceId);
    }

    return Object.fromEntries(pluginResponse);
}

export async function updateResource(event: CloudFormationCustomResourceUpdateEvent, context: Partial<Context>) {
    return await createResource(event as unknown as CloudFormationCustomResourceCreateEvent, context);
}

export async function deleteResource(_event: CloudFormationCustomResourceDeleteEvent, _context: Partial<Context>) {
    return;
}

async function _describeStack(stackName: string): Promise<Stack> {
    const params = {
        StackName: stackName,
    };
    const cfnResponse = await client.send(new DescribeStacksCommand(params));
    if (cfnResponse.Stacks?.length === 1) {
        return cfnResponse.Stacks[0];
    }
    throw new Error('Found [' + cfnResponse.Stacks?.length + '] matching stacks. Expected exactly 1.');
}

async function _describeStackResources(stackName: string): Promise<StackResource[]> {
    const params = {
        StackName: stackName,
    };
    const cfnResponse = await client.send(new DescribeStackResourcesCommand(params));
    if (cfnResponse.StackResources?.length === 1) {
        return cfnResponse.StackResources;
    }
    return [];
}

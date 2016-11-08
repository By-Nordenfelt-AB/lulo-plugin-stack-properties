'use strict';

var aws = require('aws-sdk');
var cloudformation = new aws.CloudFormation({ apiVersion: '2010-05-15' });

var pub = {};

pub.validate = function (event) {
    if (!event.ResourceProperties.StackName) {
        throw new Error('Missing required property StackName');
    }
};

pub.create = function (event, context, callback) {
    describeStack(event.ResourceProperties.StackName, function (error, stack) {
        if (error) {
            return callback(error);
        }
        describeStackResources(event.ResourceProperties.Stackname, function (error, resources) {
            if (error) {
                return callback(error);
            }

            var response = {};
            stack.Parameters.forEach(function (parameter) {
                response['Parameter.' + parameter.ParameterKey] = parameter.ParameterValue;
            });
            stack.Outputs.forEach(function (output) {
                response['Output.' + output.OutputKey] = output.OutputValue;
            });
            resources.forEach(function (resource) {
                response['Resource.' +  resource.LogicalResourceId] = resource.PhysicalResourceId;
            });
            return callback(null, response);
        });
    });
};

pub.delete = function (_event, _context, callback) {
    return setImmediate(callback);
};

pub.update = function (event, context, callback) {
    return pub.create(event, context, callback);
};

module.exports = pub;

function describeStack(stackName, callback) {
    var params = {
        StackName: stackName
    };
    cloudformation.describeStacks(params, function (error, cfnResponse) {
        if (error) {
            return callback(error);
        } else if (cfnResponse.Stacks.length !== 1) {
            error = new Error('Found [' + cfnResponse.Stacks.length + '] matching stacks. Expected exactly 1.');
            return callback(error);
        }
        callback(null, cfnResponse.Stacks[0]);
    });
}

function describeStackResources(stackName, callback) {
    var params = {
        StackName: stackName
    };
    cloudformation.listStackResources(params, function (error, cfnResponse) {
        if (error) {
            return callback(error);
        }
        return callback(null, cfnResponse.StackResourceSummaries)

    });
}

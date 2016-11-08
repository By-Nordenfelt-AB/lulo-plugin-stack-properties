'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var listStackResourcesStub = sinon.stub();
    var describeStacksStub = sinon.stub();
    var event;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        var awsSdkStub = {
            CloudFormation: function () {
                this.listStackResources = listStackResourcesStub;
                this.describeStacks = describeStacksStub;
            }
        };

        mockery.registerMock('aws-sdk', awsSdkStub);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        listStackResourcesStub.reset().resetBehavior();
        listStackResourcesStub.yields(null, { StackResourceSummaries: [{}] });
        describeStacksStub.reset().resetBehavior();
        describeStacksStub.yields(null, { Stacks: [{ Outputs: [{}], Parameters: [{}] }] });

        event = {
            ResourceProperties: { StackName: 'StackName' }
        };
    });
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('validate', function () {
        it('should succeed', function (done) {
            subject.validate(event);
            done();
        });
        it('should fail if stack name is not set', function (done) {
            delete event.ResourceProperties.StackName;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property StackName/);
            done();
        });
    });

    describe('create', function () {
        it('should succeed', function (done) {
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(response).to.be.an('object');
                done();
            });
        });
        it('should fail due to describeStacks error', function (done) {
            describeStacksStub.yields('describeStacksStub');
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal('describeStacksStub');
                expect(response).to.equal(undefined);
                done();
            });
        });
        it('should fail due to describeStacks yields more than one stack', function (done) {
            describeStacksStub.yields(null, { Stacks: [{}, {}]});
            subject.create(event, {}, function (error, response) {
                expect(error.message).to.equal('Found [2] matching stacks. Expected exactly 1.');
                expect(response).to.equal(undefined);
                done();
            });
        });
        it('should fail due to listStackResources error', function (done) {
            listStackResourcesStub.yields('listStackResources');
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal('listStackResources');
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('update', function () {
        it('should succeed', function (done) {
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(response).to.be.an('object');
                done();
            });
        });
    });

    describe('delete', function () {
        it('should succeed', function (done) {
            subject.delete(event, {}, function (error, response) {
                expect(error).to.equal(undefined);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });
});

'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var readJobStub;
    var notifyStub;
    var updateObjectsMetadataStub;
    var event;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        readJobStub = sinon.stub();
        notifyStub = sinon.stub();
        updateObjectsMetadataStub = sinon.stub();

        var elasticTranscoderMock = {
            readJob: readJobStub,
            getCallbackUrl: sinon.stub(),
            getDestinationBucket: sinon.stub(),
            getAudioFiles: sinon.stub()
        };
        var s3Mock = {
            updateObjectsMetadata: updateObjectsMetadataStub
        };
        var serviceMock = {
            notify: notifyStub
        };

        mockery.registerMock('./lib/elastic-transcoder', elasticTranscoderMock);
        mockery.registerMock('./lib/s3', s3Mock);
        mockery.registerMock('./lib/service', serviceMock);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        readJobStub.reset().resetBehavior();
        readJobStub.yields(null, { Status: 'Complete' });
        notifyStub.reset().resetBehavior();
        notifyStub.yields(null);
        updateObjectsMetadataStub.reset().resetBehavior();
        updateObjectsMetadataStub.yields();

        var message = JSON.stringify({ jobId: '123' });
        event = {
            Records: [{ Sns: { Message: message } }]
        };
    });
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('handler', function () {
        it('should succeed', function (done) {
            subject.handler(event, {}, function (error) {
                expect(error).to.equal(null);
                expect(readJobStub.calledOnce).to.equal(true);
                expect(notifyStub.calledOnce).to.equal(true);
                expect(updateObjectsMetadataStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should not do anything if job is not complete', function (done) {
            readJobStub.yields(null, { Status: 'Processing' });
            subject.handler(event, {}, function (error) {
                expect(error).to.equal(null);
                expect(readJobStub.calledOnce).to.equal(true);
                expect(notifyStub.called).to.equal(true);
                expect(updateObjectsMetadataStub.called).to.equal(false);
                done();
            });
        });
        it('should not do anything if get job fails', function (done) {
            readJobStub.yields('readJobStubError');
            subject.handler(event, {}, function (error) {
                expect(error).to.equal('readJobStubError');
                expect(readJobStub.calledOnce).to.equal(true);
                expect(notifyStub.called).to.equal(false);
                expect(updateObjectsMetadataStub.called).to.equal(false);
                done();
            });
        });
    });
});

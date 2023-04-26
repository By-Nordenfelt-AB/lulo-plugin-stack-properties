describe('Index unit tests', () => {
    let subject: typeof import('../index');
    let event: any;
    const describeStacksStub = jest.fn();
    const describeStackResourcesStub = jest.fn();
    const sendStub = jest.fn();

    jest.mock('@aws-sdk/client-cloudformation', () => ({
        ...jest.requireActual('@aws-sdk/client-cloudformation'),
        CloudFormationClient: function() {
            return { send: sendStub };
        },
        DescribeStacksCommand: describeStacksStub,
        DescribeStackResourcesCommand: describeStackResourcesStub,
    }));

    beforeAll(() => {
        subject = require('../index');
    });

    beforeEach(() => {
        sendStub
            .mockResolvedValueOnce({
                Stacks: [
                    {
                        Parameters: [{ ParameterKey: 'PKey', ParameterValue: 'PValue' }],
                        Outputs: [{ OutputKey: 'OKey', OutputValue: 'OValue' }],
                    },
                ],
            })
            .mockResolvedValueOnce({ StackResources: [{ LogicalResourceId: 'Foo', PhysicalResourceId: 'Bar' }] });

        event = {
            ResourceProperties: { StackName: 'StackName' },
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('validate', () => {
        it('should succeed', async () => {
            await subject.validateEvent(event);
        });

        it('should fail if stack name is not set', async () => {
            delete event.ResourceProperties.StackName;
            await expect(subject.validateEvent(event)).rejects.toEqual(new Error('Missing required property StackName'));
        });
    });

    describe('create', () => {
        it('should succeed', async () => {
            const response = await subject.createResource(event, {});
            expect(response).toMatchInlineSnapshot(`
                Map {
                  "Parameter.PKey" => "PValue",
                  "Output.OKey" => "OValue",
                  "Resource.Foo" => "Bar",
                }
            `);
        });

        it('should fail on aws client error', async () => {
            jest.restoreAllMocks();
            sendStub.mockRejectedValue(new Error('aws error'));
            await expect(subject.createResource(event, {})).rejects.toEqual(new Error('aws error'));
        });

        it('should fail due to describeStacks yields more than one stack', async () => {
            jest.restoreAllMocks();
            sendStub.mockResolvedValue({ Stacks: [{}, {}] });
            await expect(subject.createResource(event, {})).rejects.toEqual(new Error('Found [2] matching stacks. Expected exactly 1.'));
        });
        // it('should fail due to listStackResources error', function (done) {
        //     describeStackResourcesStub.yields('listStackResources');
        //     subject.create(event, {}, function (error, response) {
        //         expect(error).to.equal('listStackResources');
        //         expect(response).to.equal(undefined);
        //         done();
        //     });
        // });
    });

    describe('update', () => {
        it('should succeed', async () => {
            await subject.updateResource(event, {});
        });
    });
    //
    describe('delete', () => {
        it('should succeed', async () => {
            await subject.deleteResource(event, {});
        });
    });
});

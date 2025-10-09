// import type { AckFn, AllMiddlewareArgs, Logger, SlackEventMiddlewareArgs } from '@slack/bolt';
// import filtersCallback, { FilterService } from '../../../listeners/functions/filters';
// import { fakeAck, fakeComplete, fakeFail, fakeLogger } from '../../helpers';

// const validInputs = {
//   user_context: { id: 'U123456', secret: 'secret123' },
// };

// const buildArguments = ({
//   ack = fakeAck,
//   inputs = validInputs,
//   fail = fakeFail,
//   complete = fakeComplete,
//   logger = fakeLogger,
// }: {
//   ack?: AckFn<void>;
//   inputs?: Record<string, unknown>;
//   fail?: typeof fakeFail;
//   complete?: typeof fakeComplete;
//   logger?: Logger;
// }): AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'> => {
//   return {
//     ack,
//     inputs,
//     fail,
//     complete,
//     logger,
//   } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>;
// };

// describe('filtersCallback', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should successfully process valid filter inputs', async () => {
//     await filtersCallback(buildArguments({}));

//     expect(fakeComplete).toHaveBeenCalledWith({
//       outputs: {
//         filters: expect.arrayContaining([
//           expect.objectContaining({
//             name: 'languages',
//             display_name: 'Languages',
//             type: 'multi_select',
//             options: expect.arrayContaining([
//               { name: 'Python', value: 'python' },
//               { name: 'Java', value: 'java' },
//               { name: 'JavaScript', value: 'javascript' },
//               { name: 'TypeScript', value: 'typescript' },
//             ]),
//           }),
//           expect.objectContaining({
//             name: 'type',
//             display_name: 'Type',
//             type: 'multi_select',
//             options: expect.arrayContaining([
//               { name: 'Template', value: 'template' },
//               { name: 'Sample', value: 'sample' },
//             ]),
//           }),
//         ]),
//       },
//     });

//     expect(fakeAck).toHaveBeenCalled();
//     expect(fakeFail).not.toHaveBeenCalled();
//   });

//   it('should fail when inputs are invalid', async () => {
//     const invalidInputs = {
//       user_context: null, // Invalid: should be object with id
//     };

//     await filtersCallback(buildArguments({ inputs: invalidInputs }));

//     expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid filter inputs provided'));
//     expect(fakeFail).toHaveBeenCalledWith({
//       error: FilterService.FILTER_PROCESSING_ERROR_MSG,
//     });
//     expect(fakeComplete).not.toHaveBeenCalled();
//     expect(fakeAck).toHaveBeenCalled();
//   });

//   it('should fail when user_context is missing', async () => {
//     const inputsWithoutUserContext = {};

//     await filtersCallback(buildArguments({ inputs: inputsWithoutUserContext }));

//     expect(fakeFail).toHaveBeenCalledWith({
//       error: FilterService.FILTER_PROCESSING_ERROR_MSG,
//     });
//     expect(fakeComplete).not.toHaveBeenCalled();
//   });

//   it('should fail when user_context is invalid type', async () => {
//     const invalidInputs = {
//       user_context: 'invalid', // Invalid: should be object
//     };

//     await filtersCallback(buildArguments({ inputs: invalidInputs }));

//     expect(fakeFail).toHaveBeenCalledWith({
//       error: FilterService.FILTER_PROCESSING_ERROR_MSG,
//     });
//     expect(fakeComplete).not.toHaveBeenCalled();
//   });

//   it('should handle unexpected errors gracefully', async () => {
//     const errorComplete = jest.fn().mockRejectedValue(new Error('Unexpected error'));

//     await filtersCallback(buildArguments({ complete: errorComplete }));

//     expect(fakeLogger.error).toHaveBeenCalledWith(
//       expect.stringContaining('Unexpected error occurred while processing filters request'),
//     );
//     expect(fakeFail).toHaveBeenCalledWith({
//       error: FilterService.FILTER_PROCESSING_ERROR_MSG,
//     });
//     expect(fakeAck).toHaveBeenCalled();
//   });

//   it('should always call ack regardless of success or failure', async () => {
//     await filtersCallback(buildArguments({}));
//     expect(fakeAck).toHaveBeenCalled();

//     jest.clearAllMocks();

//     const invalidInputs = { user_context: null };
//     await filtersCallback(buildArguments({ inputs: invalidInputs }));
//     expect(fakeAck).toHaveBeenCalled();

//     jest.clearAllMocks();

//     const errorComplete = jest.fn().mockRejectedValue(new Error('Test error'));
//     await filtersCallback(buildArguments({ complete: errorComplete }));
//     expect(fakeAck).toHaveBeenCalled();
//   });
// });

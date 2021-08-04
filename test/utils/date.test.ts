import {getDuration} from '../../src/utils/date';

test('getDuration returns 1 week', async () => {
    jest
    .spyOn(global.Date, 'now')
    .mockImplementation(() =>
      new Date(2021, 0, 8).valueOf() //1 week ahead
    );
    const evePastDate: string = "2021-01-01T00:00:00Z"
    var output:string = getDuration(evePastDate);
    expect(output).toBe('1 week');
});

test('getDuration returns 2 weeks', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 15).valueOf() //2 weeks ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('2 weeks');
});

test('getDuration returns 1 day', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 2).valueOf() //1 day ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('1 day');
});

test('getDuration returns 2 days', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 3).valueOf() //2 days ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('2 days');
});

test('getDuration returns 1 week and 1 day', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 9).valueOf() //2 days ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('1 week and 1 day');
});

test('getDuration returns 1 week and 2 days', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 10).valueOf() //2 days ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('1 week and 2 days');
});

test('getDuration returns 2 weeks and 1 day', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 16).valueOf() //2 days ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('2 weeks and 1 day');
});

test('getDuration returns 2 weeks and 2 days', async () => {
  jest
  .spyOn(global.Date, 'now')
  .mockImplementation(() =>
    new Date(2021, 0, 17).valueOf() //2 days ahead
  );
  const evePastDate: string = "2021-01-01T00:00:00Z"
  var output:string = getDuration(evePastDate);
  expect(output).toBe('2 weeks and 2 days');
});
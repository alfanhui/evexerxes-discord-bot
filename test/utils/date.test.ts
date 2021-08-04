import {getDuration} from '../../src/utils/date';

test('getDuration returns 1 week', async () => {
    var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-08T00:00:00Z");
    expect(output).toBe('1 week');
});

test('getDuration returns 2 weeks', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-15T00:00:00Z");
  expect(output).toBe('2 weeks');
});

test('getDuration returns 1 day', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-02T00:00:00Z");
  expect(output).toBe('1 day');
});

test('getDuration returns 2 days', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-03T00:00:00Z");
  expect(output).toBe('2 days');
});

test('getDuration returns 1 week and 1 day', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-09T00:00:00Z");
  expect(output).toBe('1 week and 1 day');
});

test('getDuration returns 1 week and 2 days', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-10T00:00:00Z");
  expect(output).toBe('1 week and 2 days');
});

test('getDuration returns 2 weeks and 1 day', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-16T00:00:00Z");
  expect(output).toBe('2 weeks and 1 day');
});

test('getDuration returns 2 weeks and 2 days', async () => {
  var output:string = getDuration("2021-01-01T00:00:00Z", "2021-01-17T00:00:00Z");
  expect(output).toBe('2 weeks and 2 days');
});
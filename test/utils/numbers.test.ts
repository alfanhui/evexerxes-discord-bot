import {abbreviateNumber} from '../../src/utils/numbers';

test('abbreviateNumber returns numbered ten thousand', async () => {
    var million:string = abbreviateNumber(1000);
    expect(million).toBe('1,000.00');
});

test('abbreviateNumber returns numbered ten thousand', async () => {
    var million:string = abbreviateNumber(10000);
    expect(million).toBe('10,000.00');
});

test('abbreviateNumber returns Million', async () => {
    var million:string = abbreviateNumber(1000000);
    expect(million).toBe('1m');
});

test('abbreviateNumber returns 2.2 Million', async () => {
    var million:string = abbreviateNumber(2200000);
    expect(million).toBe('2.2m');
});

test('abbreviateNumber returns 1 Billion', async () => {
    var million:string = abbreviateNumber(1000000000);
    expect(million).toBe('1b');
});

test('abbreviateNumber returns 1 Trillion', async () => {
    var million:string = abbreviateNumber(1000000000000);
    expect(million).toBe('1t');
});

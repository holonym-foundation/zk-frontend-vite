import { SharedAsyncMemoized, GetApi } from './SharedAsyncMemoized';

describe('SharedAsyncMemoized', () => {
  let mockApiFn: jest.MockedFunction<GetApi>;

  beforeEach(() => {
    mockApiFn = jest.fn(async (key) => {
      if (key === 'test') {
        return 'value';
      }
      throw new Error(`Unknown key: ${key}`);
    });
  });

  test('waitForKey retrieves value from api function', async () => {
    const memoized = new SharedAsyncMemoized(mockApiFn);

    const result = await memoized.waitForKey('test');
    expect(result).toBe('value');
    expect(mockApiFn).toHaveBeenCalledTimes(1);
  });

  test('waitForKey caches value and does not call api function multiple times', async () => {
    const memoized = new SharedAsyncMemoized(mockApiFn);

    const result1 = await memoized.waitForKey('test');
    expect(result1).toBe('value');
    expect(mockApiFn).toHaveBeenCalledTimes(1);

    const result2 = await memoized.waitForKey('test');
    expect(result2).toBe('value');
    expect(mockApiFn).toHaveBeenCalledTimes(1);
  });

  test('waitForKey throws error for unknown key', async () => {
    const memoized = new SharedAsyncMemoized(mockApiFn);

    await expect(memoized.waitForKey('unknown')).rejects.toThrowError(
      'Unknown key: unknown',
    );
    expect(mockApiFn).toHaveBeenCalledTimes(1);
  });

  test('waitForKey throws error for undefined or null result', async () => {
    const mockApiFnUndefined = jest.fn(async () => undefined);
    const memoizedUndefined = new SharedAsyncMemoized(mockApiFnUndefined);

    await expect(memoizedUndefined.waitForKey('undefined')).rejects.toThrowError(
      'Value for key undefined',
    );
    expect(mockApiFnUndefined).toHaveBeenCalledTimes(1);

    const mockApiFnNull = jest.fn(async () => null);
    const memoizedNull = new SharedAsyncMemoized(mockApiFnNull);

    await expect(memoizedNull.waitForKey('null')).rejects.toThrowError(
      'Value for key null',
    );
    expect(mockApiFnNull).toHaveBeenCalledTimes(1);
  });
});

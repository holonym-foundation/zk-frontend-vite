import { renderHook } from '@testing-library/react-hooks';
import { useAddNewSecret } from './useAddNewSecret';

describe('useAddNewSecret', () => {
  const mockRetrievalEndpoint = 'https://example.com/credentials';
  const mockNewCreds = {
    creds: {
      secret: '1234567890',
      serializedAsPreimage: ['preimage']
    }
  };

  // In this test, we're making sure that the hook actually adds a new secret, newLeaf, and serializedAsNewPreimage to the credentials object.
  it('adds a new secret, newLeaf, and serializedAsNewPreimage to credentials', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAddNewSecret({
        retrievalEndpoint: mockRetrievalEndpoint,
        newCreds: mockNewCreds
      })
    );
    await waitForNextUpdate();
    expect(result.current.newCredsWithNewSecret?.creds.newSecret).toBeTruthy();
    expect(result.current.newCredsWithNewSecret?.newLeaf).toBeTruthy();
    expect(
      result.current.newCredsWithNewSecret?.creds.serializedAsNewPreimage
    ).toBeTruthy();
  });

  // In this test, we're making sure that if we call the hook twice with different retrieval endpoints but the same credentials, we get different secrets. This ensures that we're not accidentally adding the same secret to credentials from different sources.
  it('does not add the same secret to credentials from different retrieval endpoints', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAddNewSecret({
        retrievalEndpoint: mockRetrievalEndpoint,
        newCreds: mockNewCreds
      })
    );
    await waitForNextUpdate();
    const firstNewSecret =
      result.current.newCredsWithNewSecret?.creds.newSecret;

    const { result: result2, waitForNextUpdate: waitForNextUpdate2 } =
      renderHook(() =>
        useAddNewSecret({
          retrievalEndpoint: 'https://example.com/other-credentials',
          newCreds: mockNewCreds
        })
      );
    await waitForNextUpdate2();
    const secondNewSecret =
      result2.current.newCredsWithNewSecret?.creds.newSecret;

    expect(secondNewSecret).not.toBe(firstNewSecret);
  });

  // here we're making sure that if we call the hook twice with the same retrieval endpoint and the same credentials, we get different secrets. This ensures that we're not accidentally adding the same secret to credentials retrieved at different times.
  it('does not add the same secret to credentials from the same issuer retrieved at a different time', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAddNewSecret({
        retrievalEndpoint: mockRetrievalEndpoint,
        newCreds: mockNewCreds
      })
    );
    await waitForNextUpdate();
    const firstNewSecret =
      result.current.newCredsWithNewSecret?.creds.newSecret;

    const { result: result2, waitForNextUpdate: waitForNextUpdate2 } =
      renderHook(() =>
        useAddNewSecret({
          retrievalEndpoint: mockRetrievalEndpoint,
          newCreds: mockNewCreds
        })
      );
    await waitForNextUpdate2();
    const secondNewSecret =
      result2.current.newCredsWithNewSecret?.creds.newSecret;

    expect(secondNewSecret).not.toBe(firstNewSecret);
  });
});

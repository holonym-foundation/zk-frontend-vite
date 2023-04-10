export type GetApi<K extends string = string, V extends unknown = unknown> = (
  key: K
) => Promise<V>;

export class SharedAsyncMemoized<
  K extends string = string,
  V extends unknown = unknown
> {
  private readonly apiFn: GetApi<K, V>;
  private readonly promiseCache: Map<K, Promise<V>>;
  private readonly valueCache: Map<K, V>;

  constructor(apiFn: GetApi<K, V>) {
    this.apiFn = apiFn;
    this.promiseCache = new Map();
    this.valueCache = new Map();
  }

  async waitForKey<Key extends K, Value extends V>(key: Key): Promise<Value> {
    if (this.valueCache.has(key)) {
      return this.valueCache.get(key) as Value;
    }

    if (!this.promiseCache.has(key)) {
      const promise = this.apiFn(key);
      this.promiseCache.set(key, promise);
    }

    const result = await this.promiseCache.get(key);
    if (result === undefined || result === null) {
      throw new Error(`Value for key ${String(key)}`);
    }
    this.valueCache.set(key, result as V);
    return result as Value;
  }
}

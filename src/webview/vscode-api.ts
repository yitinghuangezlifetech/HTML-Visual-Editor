/**
 * VSCode API 封裝 - 提供 WebView 與 Extension Host 的通信
 */
export class VsCodeApi {
  private static instance: VsCodeApi;
  private api: any;

  private constructor() {
    // @ts-ignore
    this.api = acquireVsCodeApi();
  }

  static getInstance(): VsCodeApi {
    if (!VsCodeApi.instance) {
      VsCodeApi.instance = new VsCodeApi();
    }
    return VsCodeApi.instance;
  }

  postMessage(message: any): void {
    this.api.postMessage(message);
  }

  getState<T = any>(): T | undefined {
    return this.api.getState();
  }

  setState<T = any>(state: T): void {
    this.api.setState(state);
  }
}

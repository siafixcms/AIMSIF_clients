import { rpcHandlers } from './service.handler';
import type { JsonRpcRequest, JsonRpcResponse } from './types';

export async function dispatchRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { method, params, id } = request;
  const jsonrpc = '2.0';

  try {
    if (typeof rpcHandlers[method] !== 'function') {
      throw new Error(`Method ${method} not found`);
    }

    const result = await rpcHandlers[method](...(Array.isArray(params) ? params : [params]));
    return { jsonrpc, result, id };
  } catch (err: any) {
    return {
      jsonrpc,
      error: {
        code: -32603,
        message: err.message,
        data: err.stack,
      },
      id,
    };
  }
}

// src/rpc/service.handler.ts

import * as service from '../service';
import { JSONRPCRequest, JSONRPCResponse } from './types';
import { name as serviceName } from '../../package.json';

export async function handleRpcRequest(
  request: JSONRPCRequest
): Promise<JSONRPCResponse> {
  const { id, method, params } = request;

  const serviceMethod = (service as Record<string, any>)[method];

  if (typeof serviceMethod !== 'function') {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method '${method}' not found in service '${serviceName}'`,
      },
    };
  }

  try {
    const result = await serviceMethod(...(Array.isArray(params) ? params : [params]));
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  } catch (error: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error.message || 'Internal server error',
      },
    };
  }
}

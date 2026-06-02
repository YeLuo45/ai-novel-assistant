/**
 * V554 MCPProtocolHandler
 * MCP 协议处理器 - 处理 JSON-RPC 2.0 序列化/反序列化
 * 灵感来源: claude-code JSON-RPC + thunderbolt 协议处理
 * 
 * 核心功能:
 * - JSON-RPC 2.0 请求/响应序列化
 * - 批处理支持
 * - 错误构造
 * - 协议版本协商
 */

export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export interface JSONRPCBatchRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown> | unknown[];
}

export const JSONRPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000
} as const;

export const JSONRPC_ERROR_MESSAGES: Record<number, string> = {
  [-32700]: "Parse error",
  [-32600]: "Invalid Request",
  [-32601]: "Method not found",
  [-32602]: "Invalid params",
  [-32603]: "Internal error",
  [-32000]: "Server error"
};

export class MCPProtocolHandler {
  private version: "2.0" = "2.0";

  /**
   * 创建 JSON-RPC 请求
   */
  createRequest(
    method: string,
    params?: Record<string, unknown> | unknown[],
    id: string | number | null = null
  ): JSONRPCRequest {
    return {
      jsonrpc: this.version,
      id,
      method,
      params
    };
  }

  /**
   * 创建 JSON-RPC 响应 (成功)
   */
  createSuccessResponse(id: string | number | null, result: unknown): JSONRPCResponse {
    return {
      jsonrpc: this.version,
      id,
      result
    };
  }

  /**
   * 创建 JSON-RPC 响应 (错误)
   */
  createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): JSONRPCResponse {
    return {
      jsonrpc: this.version,
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * 创建 JSON-RPC 通知 (无响应)
   */
  createNotification(
    method: string,
    params?: Record<string, unknown> | unknown[]
  ): JSONRPCNotification {
    return {
      jsonrpc: this.version,
      method,
      params
    };
  }

  /**
   * 解析 JSON-RPC 消息
   */
  parse(message: unknown): JSONRPCRequest | JSONRPCResponse | JSONRPCNotification | JSONRPCBatchRequest[] {
    if (typeof message !== "object" || message === null) {
      throw this.createParseError("Message must be an object");
    }

    const msg = message as Record<string, unknown>;

    // Check for batch request
    if (Array.isArray(message)) {
      return this.parseBatch(message);
    }

    // Check jsonrpc version
    if (msg.jsonrpc !== "2.0") {
      throw this.createInvalidRequestError("Invalid JSON-RPC version");
    }

    // Determine message type
    if ("method" in msg && "id" in msg) {
      // Request
      return this.parseRequest(msg);
    } else if ("method" in msg && !("id" in msg)) {
      // Notification
      return this.parseNotification(msg);
    } else if ("result" in msg || "error" in msg) {
      // Response
      return this.parseResponse(msg);
    } else {
      throw this.createInvalidRequestError("Unknown message type");
    }
  }

  private parseRequest(msg: Record<string, unknown>): JSONRPCRequest {
    if (typeof msg.method !== "string" || msg.method === "") {
      throw this.createInvalidRequestError("Method must be a non-empty string");
    }

    return {
      jsonrpc: "2.0",
      id: msg.id as string | number | null,
      method: msg.method,
      params: msg.params as Record<string, unknown> | unknown[] | undefined
    };
  }

  private parseNotification(msg: Record<string, unknown>): JSONRPCNotification {
    if (typeof msg.method !== "string" || msg.method === "") {
      throw this.createInvalidRequestError("Method must be a non-empty string");
    }

    return {
      jsonrpc: "2.0",
      method: msg.method,
      params: msg.params as Record<string, unknown> | unknown[] | undefined
    };
  }

  private parseResponse(msg: Record<string, unknown>): JSONRPCResponse {
    return {
      jsonrpc: "2.0",
      id: msg.id as string | number | null,
      result: msg.result,
      error: msg.error as JSONRPCError | undefined
    };
  }

  private parseBatch(batch: unknown[]): JSONRPCBatchRequest[] {
    if (batch.length === 0) {
      throw this.createInvalidRequestError("Batch must not be empty");
    }

    return batch.map((item, index) => {
      try {
        return this.parse(item) as JSONRPCBatchRequest;
      } catch (error) {
        throw this.createInvalidRequestError(`Invalid batch item at index ${index}`);
      }
    });
  }

  /**
   * 序列化 JSON-RPC 消息
   */
  serialize(message: JSONRPCRequest | JSONRPCResponse | JSONRPCNotification | JSONRPCBatchRequest[]): string {
    return JSON.stringify(message);
  }

  /**
   * 反序列化 JSON-RPC 消息
   */
  deserialize(data: string): JSONRPCRequest | JSONRPCResponse | JSONRPCNotification | JSONRPCBatchRequest[] {
    try {
      const parsed = JSON.parse(data);
      return this.parse(parsed);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Parse error")) {
        throw error;
      }
      throw this.createParseError(`Invalid JSON: ${(error as Error).message}`);
    }
  }

  /**
   * 验证请求格式
   */
  validateRequest(message: unknown): { valid: boolean; error?: string } {
    try {
      this.parse(message);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * 创建标准错误响应
   */
  createMethodNotFoundError(id: string | number | null): JSONRPCResponse {
    return this.createErrorResponse(
      id,
      JSONRPC_ERROR_CODES.METHOD_NOT_FOUND,
      JSONRPC_ERROR_MESSAGES[-32601]
    );
  }

  createInvalidParamsError(id: string | number | null, data?: unknown): JSONRPCResponse {
    return this.createErrorResponse(
      id,
      JSONRPC_ERROR_CODES.INVALID_PARAMS,
      JSONRPC_ERROR_MESSAGES[-32602],
      data
    );
  }

  createInternalError(id: string | number | null, data?: unknown): JSONRPCResponse {
    return this.createErrorResponse(
      id,
      JSONRPC_ERROR_CODES.INTERNAL_ERROR,
      JSONRPC_ERROR_MESSAGES[-32603],
      data
    );
  }

  createServerError(id: string | number | null, message: string, data?: unknown): JSONRPCResponse {
    return this.createErrorResponse(
      id,
      JSONRPC_ERROR_CODES.SERVER_ERROR,
      message,
      data
    );
  }

  /**
   * 创建错误对象
   */
  private createParseError(message: string): Error {
    const error = new Error(`Parse error: ${message}`);
    (error as Error & { code: number }).code = JSONRPC_ERROR_CODES.PARSE_ERROR;
    return error;
  }

  private createInvalidRequestError(message: string): Error {
    const error = new Error(`Invalid Request: ${message}`);
    (error as Error & { code: number }).code = JSONRPC_ERROR_CODES.INVALID_REQUEST;
    return error;
  }

  /**
   * 检查是否是错误响应
   */
  isErrorResponse(response: JSONRPCResponse): boolean {
    return response.error !== undefined;
  }

  /**
   * 获取协议版本
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * 设置协议版本
   */
  setVersion(version: string): void {
    if (version !== "2.0") {
      throw new Error(`Unsupported JSON-RPC version: ${version}`);
    }
    this.version = version;
  }
}

export default MCPProtocolHandler;

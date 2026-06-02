/**
 * V554 MCPProtocolHandler Test Suite
 * 测试覆盖率目标: ≥99%
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MCPProtocolHandler,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  JSONRPC_ERROR_CODES
} from "./MCPProtocolHandler";

describe("V554 MCPProtocolHandler", () => {
  let handler: MCPProtocolHandler;

  beforeEach(() => {
    handler = new MCPProtocolHandler();
  });

  describe("createRequest", () => {
    it("should create request without params", () => {
      const request = handler.createRequest("test.method");
      expect(request.jsonrpc).toBe("2.0");
      expect(request.method).toBe("test.method");
      expect(request.params).toBeUndefined();
    });

    it("should create request with object params", () => {
      const request = handler.createRequest("test.method", { key: "value" });
      expect(request.params).toEqual({ key: "value" });
    });

    it("should create request with array params", () => {
      const request = handler.createRequest("test.method", [1, 2, 3]);
      expect(request.params).toEqual([1, 2, 3]);
    });

    it("should create request with numeric id", () => {
      const request = handler.createRequest("test.method", {}, 42);
      expect(request.id).toBe(42);
    });

    it("should create request with string id", () => {
      const request = handler.createRequest("test.method", {}, "id-123");
      expect(request.id).toBe("id-123");
    });

    it("should create request with null id", () => {
      const request = handler.createRequest("test.method", {}, null);
      expect(request.id).toBeNull();
    });
  });

  describe("createSuccessResponse", () => {
    it("should create success response", () => {
      const response = handler.createSuccessResponse(42, { result: "success" });
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(42);
      expect(response.result).toEqual({ result: "success" });
      expect(response.error).toBeUndefined();
    });

    it("should create success response with null id", () => {
      const response = handler.createSuccessResponse(null, "done");
      expect(response.id).toBeNull();
      expect(response.result).toBe("done");
    });

    it("should create success response with string id", () => {
      const response = handler.createSuccessResponse("req-1", { data: 123 });
      expect(response.id).toBe("req-1");
      expect(response.result).toEqual({ data: 123 });
    });
  });

  describe("createErrorResponse", () => {
    it("should create error response", () => {
      const response = handler.createErrorResponse(42, -32601, "Method not found");
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(42);
      expect(response.error?.code).toBe(-32601);
      expect(response.error?.message).toBe("Method not found");
    });

    it("should create error response with data", () => {
      const response = handler.createErrorResponse(42, -32602, "Invalid params", { details: "missing field" });
      expect(response.error?.data).toEqual({ details: "missing field" });
    });

    it("should create error response with null id", () => {
      const response = handler.createErrorResponse(null, -32700, "Parse error");
      expect(response.id).toBeNull();
      expect(response.error?.code).toBe(-32700);
    });
  });

  describe("createNotification", () => {
    it("should create notification without params", () => {
      const notification = handler.createNotification("event.name");
      expect(notification.jsonrpc).toBe("2.0");
      expect(notification.method).toBe("event.name");
      expect(notification.params).toBeUndefined();
    });

    it("should create notification with params", () => {
      const notification = handler.createNotification("event.name", { value: 42 });
      expect(notification.method).toBe("event.name");
      expect(notification.params).toEqual({ value: 42 });
    });
  });

  describe("parse", () => {
    it("should parse valid request", () => {
      const parsed = handler.parse({
        jsonrpc: "2.0",
        id: 1,
        method: "test.method",
        params: { key: "value" }
      }) as JSONRPCRequest;

      expect(parsed.jsonrpc).toBe("2.0");
      expect(parsed.id).toBe(1);
      expect(parsed.method).toBe("test.method");
      expect(parsed.params).toEqual({ key: "value" });
    });

    it("should parse notification", () => {
      const parsed = handler.parse({
        jsonrpc: "2.0",
        method: "notify.event"
      }) as JSONRPCNotification;

      expect(parsed.method).toBe("notify.event");
      // JSONRPCNotification type doesn't have id property
      expect((parsed as unknown as Record<string, unknown>).id).toBeUndefined();
    });

    it("should parse success response", () => {
      const parsed = handler.parse({
        jsonrpc: "2.0",
        id: 1,
        result: { success: true }
      }) as JSONRPCResponse;

      expect(parsed.result).toEqual({ success: true });
      expect(parsed.error).toBeUndefined();
    });

    it("should parse error response", () => {
      const parsed = handler.parse({
        jsonrpc: "2.0",
        id: 1,
        error: { code: -32601, message: "Method not found" }
      }) as JSONRPCResponse;

      expect(parsed.error?.code).toBe(-32601);
      expect(parsed.error?.message).toBe("Method not found");
    });

    it("should parse batch request", () => {
      const parsed = handler.parse([
        { jsonrpc: "2.0", id: 1, method: "method1" },
        { jsonrpc: "2.0", id: 2, method: "method2" }
      ]) as JSONRPCRequest[];

      expect(parsed).toHaveLength(2);
      expect(parsed[0].method).toBe("method1");
      expect(parsed[1].method).toBe("method2");
    });

    it("should throw on non-object message", () => {
      expect(() => handler.parse("string")).toThrow("Message must be an object");
    });

    it("should throw on null message", () => {
      expect(() => handler.parse(null)).toThrow("Message must be an object");
    });

    it("should throw on invalid jsonrpc version", () => {
      expect(() => handler.parse({
        jsonrpc: "1.0",
        method: "test"
      })).toThrow("Invalid JSON-RPC version");
    });

    it("should throw on missing method in request", () => {
      expect(() => handler.parse({
        jsonrpc: "2.0",
        id: 1
      })).toThrow("Unknown message type");
    });

    it("should throw on empty method", () => {
      expect(() => handler.parse({
        jsonrpc: "2.0",
        id: 1,
        method: ""
      })).toThrow("Method must be a non-empty string");
    });

    it("should throw on unknown message type", () => {
      expect(() => handler.parse({
        jsonrpc: "2.0",
        unknown: "field"
      })).toThrow("Unknown message type");
    });

    it("should throw on empty batch", () => {
      expect(() => handler.parse([])).toThrow("Batch must not be empty");
    });
  });

  describe("serialize/deserialize", () => {
    it("should serialize and deserialize request", () => {
      const request = handler.createRequest("test.method", { key: "value" }, 42);
      const serialized = handler.serialize(request);
      const parsed = handler.deserialize(serialized) as JSONRPCRequest;

      expect(parsed.method).toBe("test.method");
      expect(parsed.params).toEqual({ key: "value" });
      expect(parsed.id).toBe(42);
    });

    it("should serialize and deserialize response", () => {
      const response = handler.createSuccessResponse(42, { result: "success" });
      const serialized = handler.serialize(response);
      const parsed = handler.deserialize(serialized) as JSONRPCResponse;

      expect(parsed.result).toEqual({ result: "success" });
    });

    it("should serialize and deserialize notification", () => {
      const notification = handler.createNotification("event.name", { value: 123 });
      const serialized = handler.serialize(notification);
      const parsed = handler.deserialize(serialized) as JSONRPCNotification;

      expect(parsed.method).toBe("event.name");
      expect(parsed.params).toEqual({ value: 123 });
    });

    it("should throw on invalid JSON string", () => {
      expect(() => handler.deserialize("invalid json")).toThrow("Parse error");
    });

    it("should throw on empty string", () => {
      expect(() => handler.deserialize("")).toThrow("Parse error");
    });
  });

  describe("validateRequest", () => {
    it("should return valid for valid request", () => {
      const result = handler.validateRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "test"
      });
      expect(result.valid).toBe(true);
    });

    it("should return invalid with error message for invalid request", () => {
      const result = handler.validateRequest({
        jsonrpc: "1.0",
        method: "test"
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid JSON-RPC version");
    });
  });

  describe("error factory methods", () => {
    it("should create method not found error", () => {
      const response = handler.createMethodNotFoundError(42);
      expect(response.error?.code).toBe(JSONRPC_ERROR_CODES.METHOD_NOT_FOUND);
      expect(response.error?.message).toBe("Method not found");
    });

    it("should create invalid params error", () => {
      const response = handler.createInvalidParamsError(42, { field: "required" });
      expect(response.error?.code).toBe(JSONRPC_ERROR_CODES.INVALID_PARAMS);
      expect(response.error?.data).toEqual({ field: "required" });
    });

    it("should create internal error", () => {
      const response = handler.createInternalError(42);
      expect(response.error?.code).toBe(JSONRPC_ERROR_CODES.INTERNAL_ERROR);
    });

    it("should create server error", () => {
      const response = handler.createServerError(42, "Custom server error", { debug: true });
      expect(response.error?.code).toBe(JSONRPC_ERROR_CODES.SERVER_ERROR);
      expect(response.error?.message).toBe("Custom server error");
      expect(response.error?.data).toEqual({ debug: true });
    });
  });

  describe("isErrorResponse", () => {
    it("should return true for error response", () => {
      const response = handler.createErrorResponse(42, -32601, "Error");
      expect(handler.isErrorResponse(response)).toBe(true);
    });

    it("should return false for success response", () => {
      const response = handler.createSuccessResponse(42, { success: true });
      expect(handler.isErrorResponse(response)).toBe(false);
    });
  });

  describe("getVersion/setVersion", () => {
    it("should return version 2.0", () => {
      expect(handler.getVersion()).toBe("2.0");
    });

    it("should throw on setting unsupported version", () => {
      expect(() => handler.setVersion("1.0")).toThrow("Unsupported JSON-RPC version: 1.0");
    });
  });
});

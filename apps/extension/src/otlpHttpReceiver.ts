import * as http from "node:http";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

import { logInfo, logWarn } from "./logger";
import {
  type OtlpHttpSignal,
  decodeOtlpHttpPayload,
  encodeOtlpHttpSuccessResponse,
} from "./otlpProto";

const gunzipAsync = promisify(gunzip);
// Copilot exports batched telemetry in the low-KB range; anything close to
// this cap is misdirected traffic and only risks large heap spikes.
const maxOtlpRequestBytes = 8 * 1024 * 1024;

export interface OtlpHttpReceiver {
  endpoint: string;
  dispose(): void;
}

export async function startOtlpHttpReceiver(
  onRecords: (records: unknown[], signal: OtlpHttpSignal) => void,
  port = 0,
): Promise<OtlpHttpReceiver> {
  const server = http.createServer((request, response) => {
    void handleOtlpRequest(request, response, onRecords);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      // An "error" event without a listener is rethrown as an uncaught
      // exception and would take down the extension host.
      server.on("error", (error) => {
        logWarn("OTLP HTTP receiver server error", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not determine local OTLP receiver address.");
  }

  const endpoint = `http://127.0.0.1:${address.port}`;
  logInfo("Started local OTLP HTTP receiver", {
    endpoint,
    configuredPort: port,
  });
  return {
    endpoint,
    dispose: () => {
      // close() alone waits for keep-alive sockets (Copilot's exporter uses
      // them) to drain, leaving the port bound and the next bind failing
      // with EADDRINUSE.
      server.closeAllConnections();
      server.close();
      logInfo("Stopped local OTLP HTTP receiver", { endpoint });
    },
  };
}

async function handleOtlpRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  onRecords: (records: unknown[], signal: OtlpHttpSignal) => void,
) {
  const signal = signalFromPath(request.url ?? "");
  if (request.method !== "POST" || !signal) {
    response.writeHead(404).end();
    return;
  }

  try {
    const body = await readRequestBody(request);
    const decodedBody = await decodeRequestBody(request, body);
    if (signal !== "metrics") {
      const record = decodeOtlpHttpPayload(
        signal,
        decodedBody,
        firstHeaderValue(request.headers["content-type"]),
      );
      onRecords([record], signal);
    }

    const success = encodeOtlpHttpSuccessResponse(
      signal,
      firstHeaderValue(request.headers["content-type"]),
    );
    response.writeHead(200, {
      "content-type": success.contentType,
      "content-length": String(success.body.length),
    });
    response.end(success.body);
  } catch (error) {
    logWarn("Could not handle OTLP HTTP request", {
      path: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : String(error),
    });
    response.writeHead(400).end();
  }
}

function signalFromPath(pathValue: string): OtlpHttpSignal | null {
  const pathName = pathValue.split("?")[0];
  if (pathName === "/v1/logs") {
    return "logs";
  }
  if (pathName === "/v1/traces") {
    return "traces";
  }
  if (pathName === "/v1/metrics") {
    return "metrics";
  }
  return null;
}

async function readRequestBody(request: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > maxOtlpRequestBytes) {
      throw new Error("OTLP request body is too large.");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

async function decodeRequestBody(
  request: http.IncomingMessage,
  body: Buffer,
): Promise<Uint8Array> {
  const encoding = firstHeaderValue(request.headers["content-encoding"]);
  if (!encoding || encoding.toLowerCase() === "identity") {
    return body;
  }
  if (encoding.toLowerCase() === "gzip") {
    return gunzipAsync(body);
  }
  throw new Error(`Unsupported OTLP content encoding: ${encoding}`);
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

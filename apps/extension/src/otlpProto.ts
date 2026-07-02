export type OtlpHttpSignal = "logs" | "traces" | "metrics";

type FieldKind =
  | "bool"
  | "bytes"
  | "double"
  | "fixed32"
  | "fixed64"
  | "int32"
  | "int64"
  | "message"
  | "string"
  | "uint32"
  | "uint64";

interface FieldDescriptor {
  tag: number;
  name: string;
  kind: FieldKind;
  repeated?: boolean;
  bytesAsHex?: boolean;
  message?: () => MessageDescriptor;
}

type MessageDescriptor = readonly FieldDescriptor[];

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const keyValueListDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "values",
    kind: "message",
    repeated: true,
    message: () => keyValueDescriptor,
  },
];

const arrayValueDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "values",
    kind: "message",
    repeated: true,
    message: () => anyValueDescriptor,
  },
];

const anyValueDescriptor: MessageDescriptor = [
  { tag: 1, name: "stringValue", kind: "string" },
  { tag: 2, name: "boolValue", kind: "bool" },
  { tag: 3, name: "intValue", kind: "int64" },
  { tag: 4, name: "doubleValue", kind: "double" },
  {
    tag: 5,
    name: "arrayValue",
    kind: "message",
    message: () => arrayValueDescriptor,
  },
  {
    tag: 6,
    name: "kvlistValue",
    kind: "message",
    message: () => keyValueListDescriptor,
  },
  { tag: 7, name: "bytesValue", kind: "bytes" },
];

const keyValueDescriptor: MessageDescriptor = [
  { tag: 1, name: "key", kind: "string" },
  {
    tag: 2,
    name: "value",
    kind: "message",
    message: () => anyValueDescriptor,
  },
];

const resourceDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "attributes",
    kind: "message",
    repeated: true,
    message: () => keyValueDescriptor,
  },
  { tag: 2, name: "droppedAttributesCount", kind: "uint32" },
];

const instrumentationScopeDescriptor: MessageDescriptor = [
  { tag: 1, name: "name", kind: "string" },
  { tag: 2, name: "version", kind: "string" },
  {
    tag: 3,
    name: "attributes",
    kind: "message",
    repeated: true,
    message: () => keyValueDescriptor,
  },
  { tag: 4, name: "droppedAttributesCount", kind: "uint32" },
];

const logRecordDescriptor: MessageDescriptor = [
  { tag: 1, name: "timeUnixNano", kind: "fixed64" },
  { tag: 2, name: "severityNumber", kind: "int32" },
  { tag: 3, name: "severityText", kind: "string" },
  {
    tag: 5,
    name: "body",
    kind: "message",
    message: () => anyValueDescriptor,
  },
  {
    tag: 6,
    name: "attributes",
    kind: "message",
    repeated: true,
    message: () => keyValueDescriptor,
  },
  { tag: 7, name: "droppedAttributesCount", kind: "uint32" },
  { tag: 8, name: "flags", kind: "fixed32" },
  { tag: 9, name: "traceId", kind: "bytes", bytesAsHex: true },
  { tag: 10, name: "spanId", kind: "bytes", bytesAsHex: true },
  { tag: 11, name: "observedTimeUnixNano", kind: "fixed64" },
  { tag: 12, name: "eventName", kind: "string" },
];

const scopeLogsDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "scope",
    kind: "message",
    message: () => instrumentationScopeDescriptor,
  },
  {
    tag: 2,
    name: "logRecords",
    kind: "message",
    repeated: true,
    message: () => logRecordDescriptor,
  },
  { tag: 3, name: "schemaUrl", kind: "string" },
];

const resourceLogsDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "resource",
    kind: "message",
    message: () => resourceDescriptor,
  },
  {
    tag: 2,
    name: "scopeLogs",
    kind: "message",
    repeated: true,
    message: () => scopeLogsDescriptor,
  },
  { tag: 3, name: "schemaUrl", kind: "string" },
];

const exportLogsServiceRequestDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "resourceLogs",
    kind: "message",
    repeated: true,
    message: () => resourceLogsDescriptor,
  },
];

const spanDescriptor: MessageDescriptor = [
  { tag: 1, name: "traceId", kind: "bytes", bytesAsHex: true },
  { tag: 2, name: "spanId", kind: "bytes", bytesAsHex: true },
  { tag: 3, name: "traceState", kind: "string" },
  { tag: 4, name: "parentSpanId", kind: "bytes", bytesAsHex: true },
  { tag: 5, name: "name", kind: "string" },
  { tag: 6, name: "kind", kind: "int32" },
  { tag: 7, name: "startTimeUnixNano", kind: "fixed64" },
  { tag: 8, name: "endTimeUnixNano", kind: "fixed64" },
  {
    tag: 9,
    name: "attributes",
    kind: "message",
    repeated: true,
    message: () => keyValueDescriptor,
  },
  { tag: 10, name: "droppedAttributesCount", kind: "uint32" },
];

const scopeSpansDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "scope",
    kind: "message",
    message: () => instrumentationScopeDescriptor,
  },
  {
    tag: 2,
    name: "spans",
    kind: "message",
    repeated: true,
    message: () => spanDescriptor,
  },
  { tag: 3, name: "schemaUrl", kind: "string" },
];

const resourceSpansDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "resource",
    kind: "message",
    message: () => resourceDescriptor,
  },
  {
    tag: 2,
    name: "scopeSpans",
    kind: "message",
    repeated: true,
    message: () => scopeSpansDescriptor,
  },
  { tag: 3, name: "schemaUrl", kind: "string" },
];

const exportTraceServiceRequestDescriptor: MessageDescriptor = [
  {
    tag: 1,
    name: "resourceSpans",
    kind: "message",
    repeated: true,
    message: () => resourceSpansDescriptor,
  },
];

export function decodeOtlpHttpPayload(
  signal: OtlpHttpSignal,
  body: Uint8Array,
  contentType: string | undefined,
): unknown {
  if (isJsonContentType(contentType)) {
    return JSON.parse(textDecoder.decode(body)) as unknown;
  }

  if (!isProtobufContentType(contentType)) {
    throw new Error(`Unsupported OTLP content type: ${contentType}`);
  }

  if (signal === "metrics") {
    return {};
  }

  return decodeMessage(descriptorForSignal(signal), body);
}

export function encodeOtlpHttpPayload(
  signal: Exclude<OtlpHttpSignal, "metrics">,
  value: Record<string, unknown>,
): Uint8Array {
  return encodeMessage(descriptorForSignal(signal), value);
}

export function encodeOtlpHttpSuccessResponse(
  _signal: OtlpHttpSignal,
  contentType: string | undefined,
): { body: Uint8Array; contentType: string } {
  if (isJsonContentType(contentType)) {
    return {
      body: textEncoder.encode("{}"),
      contentType: "application/json",
    };
  }

  return {
    body: new Uint8Array(),
    contentType: "application/x-protobuf",
  };
}

function descriptorForSignal(
  signal: Exclude<OtlpHttpSignal, "metrics">,
): MessageDescriptor {
  return signal === "logs"
    ? exportLogsServiceRequestDescriptor
    : exportTraceServiceRequestDescriptor;
}

function decodeMessage(
  descriptor: MessageDescriptor,
  bytes: Uint8Array,
): Record<string, unknown> {
  const reader = new ProtoReader(bytes);
  const record: Record<string, unknown> = {};
  while (!reader.done) {
    const tag = Number(reader.readVarint());
    const fieldNumber = tag >>> 3;
    const wireType = tag & 0x7;
    const field = descriptor.find((entry) => entry.tag === fieldNumber);
    if (!field) {
      reader.skipField(wireType);
      continue;
    }

    const value = reader.readField(field, wireType);
    if (field.repeated) {
      const current = record[field.name];
      if (Array.isArray(current)) {
        current.push(value);
      } else {
        record[field.name] = [value];
      }
    } else {
      record[field.name] = value;
    }
  }
  return record;
}

function encodeMessage(
  descriptor: MessageDescriptor,
  value: Record<string, unknown>,
): Uint8Array {
  const writer = new ProtoWriter();
  for (const field of descriptor) {
    const fieldValue = value[field.name];
    if (fieldValue === undefined || fieldValue === null) {
      continue;
    }

    if (field.repeated) {
      if (!Array.isArray(fieldValue)) {
        continue;
      }
      for (const entry of fieldValue) {
        writer.writeField(field, entry);
      }
    } else {
      writer.writeField(field, fieldValue);
    }
  }
  return writer.finish();
}

class ProtoReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done() {
    return this.offset >= this.bytes.length;
  }

  readField(field: FieldDescriptor, wireType: number): unknown {
    switch (field.kind) {
      case "bool":
        this.expectWireType(field, wireType, 0);
        return this.readVarint() !== 0n;
      case "bytes":
        this.expectWireType(field, wireType, 2);
        return this.readBytes(field.bytesAsHex);
      case "double":
        this.expectWireType(field, wireType, 1);
        return this.readDouble();
      case "fixed32":
        this.expectWireType(field, wireType, 5);
        return this.readFixed32();
      case "fixed64":
        this.expectWireType(field, wireType, 1);
        return this.readFixed64String();
      case "int32":
      case "uint32":
        this.expectWireType(field, wireType, 0);
        return Number(this.readVarint());
      case "int64":
      case "uint64":
        this.expectWireType(field, wireType, 0);
        return this.readVarint().toString();
      case "message": {
        this.expectWireType(field, wireType, 2);
        const nested = this.readLengthDelimited();
        return decodeMessage(field.message?.() ?? [], nested);
      }
      case "string":
        this.expectWireType(field, wireType, 2);
        return textDecoder.decode(this.readLengthDelimited());
    }
  }

  readVarint(): bigint {
    let shift = 0n;
    let result = 0n;
    for (let index = 0; index < 10; index += 1) {
      const byte = this.readByte();
      result |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) {
        return result;
      }
      shift += 7n;
    }
    throw new Error("Invalid protobuf varint.");
  }

  skipField(wireType: number) {
    switch (wireType) {
      case 0:
        this.readVarint();
        return;
      case 1:
        this.skipBytes(8);
        return;
      case 2: {
        const length = Number(this.readVarint());
        this.skipBytes(length);
        return;
      }
      case 5:
        this.skipBytes(4);
        return;
      default:
        throw new Error(`Unsupported protobuf wire type: ${wireType}`);
    }
  }

  private expectWireType(
    field: FieldDescriptor,
    actual: number,
    expected: number,
  ) {
    if (actual !== expected) {
      throw new Error(
        `Unexpected wire type ${actual} for OTLP field ${field.name}.`,
      );
    }
  }

  private readByte() {
    this.ensureAvailable(1);
    const byte = this.bytes[this.offset];
    this.offset += 1;
    return byte;
  }

  private readLengthDelimited() {
    const length = Number(this.readVarint());
    this.ensureAvailable(length);
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  private readBytes(bytesAsHex: boolean | undefined) {
    const bytes = this.readLengthDelimited();
    return bytesAsHex ? bytesToHex(bytes) : Array.from(bytes);
  }

  private readFixed32() {
    this.ensureAvailable(4);
    const value = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.offset,
      4,
    ).getUint32(0, true);
    this.offset += 4;
    return value;
  }

  private readFixed64String() {
    this.ensureAvailable(8);
    const value = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.offset,
      8,
    ).getBigUint64(0, true);
    this.offset += 8;
    return value.toString();
  }

  private readDouble() {
    this.ensureAvailable(8);
    const value = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.offset,
      8,
    ).getFloat64(0, true);
    this.offset += 8;
    return value;
  }

  private skipBytes(length: number) {
    this.ensureAvailable(length);
    this.offset += length;
  }

  private ensureAvailable(length: number) {
    if (length < 0 || this.offset + length > this.bytes.length) {
      throw new Error("Truncated protobuf payload.");
    }
  }
}

class ProtoWriter {
  private chunks: number[] = [];

  writeField(field: FieldDescriptor, value: unknown) {
    switch (field.kind) {
      case "bool":
        this.writeTag(field.tag, 0);
        this.writeVarint(value ? 1n : 0n);
        return;
      case "bytes":
        this.writeTag(field.tag, 2);
        this.writeLengthDelimited(normalizeBytes(value));
        return;
      case "double":
        this.writeTag(field.tag, 1);
        this.writeDouble(Number(value));
        return;
      case "fixed32":
        this.writeTag(field.tag, 5);
        this.writeFixed32(Number(value));
        return;
      case "fixed64":
        this.writeTag(field.tag, 1);
        this.writeFixed64(value);
        return;
      case "int32":
      case "uint32":
        this.writeTag(field.tag, 0);
        this.writeVarint(BigInt(Number(value)));
        return;
      case "int64":
      case "uint64":
        this.writeTag(field.tag, 0);
        this.writeVarint(toBigInt(value));
        return;
      case "message":
        if (!isRecord(value)) {
          return;
        }
        this.writeTag(field.tag, 2);
        this.writeLengthDelimited(encodeMessage(field.message?.() ?? [], value));
        return;
      case "string":
        this.writeTag(field.tag, 2);
        this.writeLengthDelimited(textEncoder.encode(String(value)));
        return;
    }
  }

  finish() {
    return Uint8Array.from(this.chunks);
  }

  private writeTag(fieldNumber: number, wireType: number) {
    this.writeVarint(BigInt((fieldNumber << 3) | wireType));
  }

  private writeVarint(value: bigint) {
    let remaining = value;
    while (remaining >= 0x80n) {
      this.chunks.push(Number((remaining & 0x7fn) | 0x80n));
      remaining >>= 7n;
    }
    this.chunks.push(Number(remaining));
  }

  private writeLengthDelimited(value: Uint8Array) {
    this.writeVarint(BigInt(value.length));
    this.writeBytes(value);
  }

  private writeBytes(value: Uint8Array) {
    for (const byte of value) {
      this.chunks.push(byte);
    }
  }

  private writeFixed32(value: number) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.writeBytes(bytes);
  }

  private writeFixed64(value: unknown) {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, toBigInt(value), true);
    this.writeBytes(bytes);
  }

  private writeDouble(value: number) {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setFloat64(0, value, true);
    this.writeBytes(bytes);
  }
}

function isJsonContentType(contentType: string | undefined) {
  return contentType?.toLowerCase().includes("json") === true;
}

function isProtobufContentType(contentType: string | undefined) {
  if (!contentType) {
    return true;
  }
  const normalized = contentType.toLowerCase();
  return normalized.includes("protobuf") || normalized.includes("octet-stream");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(
      value.map((entry) =>
        typeof entry === "number" ? entry & 0xff : Number(entry) & 0xff,
      ),
    );
  }
  if (typeof value === "string") {
    return hexToBytes(value);
  }
  return new Uint8Array();
}

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (typeof value === "string" && value.length > 0) {
    return BigInt(value);
  }
  return 0n;
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(value: string) {
  const normalized = value.replace(/[^0-9a-f]/gi, "");
  const bytes = new Uint8Array(Math.floor(normalized.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

import type { Message } from "ai";

export const devData: Array<{ input: Array<Message>, expected: string }> = [
  {
    input: [
      {
        id: "1",
        role: "user",
        content:
          "What is the latest version of TypeScript?",
      },
    ],
    expected: "5.9.2"
  },
  {
    input: [
      {
        id: "1",
        role: "user",
        content:
          "What are the differences between REST and gRPC?",
      },
    ],
    expected: `REST and gRPC are two distinct architectural styles used for building APIs, each with its own strengths and ideal use cases.
  REST (Representational State Transfer)
  Design: Resource-oriented, using unique URLs to identify resources and standard HTTP methods (GET, POST, PUT, DELETE) to perform actions on them.
  Communication: Typically relies on HTTP/1.1 and a request/response cycle.
  Data Format: Commonly uses human-readable formats like JSON or XML for data exchange.
  Strengths: Broad compatibility, ease of use for public APIs, and statelessness, making it suitable for loosely coupled systems and web applications.

  gRPC (Google Remote Procedure Call)
  Design: Service-oriented, defining callable server operations as services and methods.
  Communication: Leverages HTTP/2, enabling features like multiplexing, header compression, and various streaming patterns (unary, server streaming, client streaming, bidirectional streaming).
  Data Format: Uses Protocol Buffers (Protobuf) for efficient, binary serialization of structured data, resulting in smaller payloads and faster communication.
  Strengths: High performance and low latency due to HTTP/2 and Protobuf, strong typing and code generation capabilities, making it well-suited for internal microservices, real-time applications, and polyglot environments.`,
  },
]
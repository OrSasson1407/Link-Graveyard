import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import * as client from "prom-client";

@Controller("metrics")
export class MetricsController {
  private readonly registry: client.Registry;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    // Custom BullMQ queue depth gauge
    new client.Gauge({
      name: "bullmq_queue_depth",
      help: "Current depth of BullMQ queues",
      labelNames: ["queue"],
      registers: [this.registry],
    });

    // Endpoint latency histogram
    new client.Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });
  }

  @Get()
  async getMetrics(@Res() res: Response) {
    res.set("Content-Type", this.registry.contentType);
    res.end(await this.registry.metrics());
  }
}

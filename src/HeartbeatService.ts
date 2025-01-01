import axios from 'axios';
import { HeartbeatConfig } from './types';

export class HeartbeatService {
  private config: HeartbeatConfig;
  private lastHeartbeat: Date | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: HeartbeatConfig) {
    this.config = config;
  }

  private healthy: boolean = true;

  public async sendHeartbeat(): Promise<void> {
    if (!this.config.enabled || !this.config.url) {
      return;
    }

    try {
      if (this.healthy) {
        await axios.get(this.config.url);
        this.lastHeartbeat = new Date();
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }

  public setHealthStatus(healthy: boolean): void {
    this.healthy = healthy;
  }

  public start(): void {
    if (!this.config.enabled || !this.config.url) {
      return;
    }

    // Send initial heartbeat
    this.sendHeartbeat();

    // Setup interval for subsequent heartbeats
    const interval = this.config.interval || 60; // Default to 60 seconds if not specified
    this.timer = setInterval(() => {
      this.sendHeartbeat();
    }, interval * 1000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getLastHeartbeat(): Date | null {
    return this.lastHeartbeat;
  }
}

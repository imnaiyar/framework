import { sendErrorLog } from "#src/utils/sendErrorLogs";
import { DateTime } from "luxon";

export interface LogOptions {
  level?: LogLevel;

  /** If set to `false`, does not outputs date to the console (default: `true`) */
  timestamp?: boolean;

  /** Do not indicate level in the log (default: `false`) */
  hideLevel?: boolean;
}
export type LogLevel = {
  /** Name of the level */
  name: LogLevels | string;

  /** ANSI color for the custom log level, (This field will be ignored if the log level name provided already exists) */
  color?: string;
};
export type LogLevels = "info" | "debug" | "warn" | "error";
class Logger {
  private levels: Map<string, LogLevel>;
  private timestamp = true;
  private singleLineError = true;
  constructor(private readonly options?: LoggerOption) {
    this.levels = new Map([
      ["debug", { name: "DEBUG", color: "\x1b[36m" }], // Cyan
      ["info", { name: "INFO", color: "\x1b[32m" }], // Green
      ["warn", { name: "WARN", color: "\x1b[33m" }], // Yellow
      ["error", { name: "ERROR", color: "\x1b[31m" }], // Red
      ["custom", { name: "CUSTOM", color: "\x1b[35m" }], // Magenta, default custom level
    ]);
    if (options?.timestamp === false) this.timestamp = false;
    if (options?.env === "development") this.singleLineError = false;
    if (options?.singleLineError === false) this.singleLineError = false;
  }
  // hell
  addCustomLevel(name: string, color: string): void {
    this.levels.set(name.toLowerCase(), { name: name.toUpperCase(), color: color });
  }

  /**
   * @param level Custom Log level
   * @param content Any following content to log
   */
  log(level: LogLevels, ...content: any): void;

  /**
   * @param level Custom Log level
   * @param content Any following content to log
   */
  log(level: string, ...content: any): void;

  /**
   *
   * @param level Custom log level to use for the given log
   * @param content Any following content to log
   */
  log(level: LogOptions, ...content: any): void;

  log(level: string | LogOptions, ...content: any): void {
    const date = "[" + DateTime.now().setZone(this.options?.timezone).toFormat("dd LLL yyyy hh:mm:ss a") + "]";
    const logLevel =
      typeof level === "object"
        ? level.level
          ? this.levels.get(level.level.name.toLowerCase()) || level.level
          : undefined
        : this.levels.get(level.toLowerCase());
    if (typeof level === "object" && level.timestamp === false) this.timestamp = false;
    if (logLevel) {
      let text = `[${logLevel.name}]`;
      if (logLevel.color) text = logLevel.color + `[${logLevel.name}]\x1b[0m`;
      if (typeof level === "object" && level.hideLevel) text = "";
      if (this.timestamp) text = "\x1b[90m" + date + "\x1b[0m" + " " + text;
      console.log(text, ...content);
    } else {
      console.log(...content);
    }
  }

  debug(...message: any): void {
    this.log("debug", ...message);
  }

  info(...message: any): void {
    this.log("info", ...message);
  }

  warn(...message: any): void {
    this.log("warn", ...message);
  }

  error(content: any): void;
  error(content: string, err: any): void;
  error(content: any | string, err?: any): void {
    const text = err && err instanceof Error ? content + " " + err.message : content instanceof Error ? content.message : content;
    const colored = `\x1b[31m${text}\x1b[0m`;
    if (this.singleLineError) {
      this.log("error", colored);
    } else {
      err ? this.log("error", colored, "\n", err) : this.log("error", colored);
    }
    if (this.options?.errorWebhook) sendErrorLog(this.options.errorWebhook, content, err);
  }
}

export { Logger };

export interface LoggerOption {
  /** Timezone you want the time to display in (Systems time if not set) */
  timezone?: string;

  /** Discord webhook url to send the error logs to */
  errorWebhook?: string;

  /** If false, doesn't output timestamp to console. (default `true`) */
  timestamp?: boolean;

  env?: "production" | "development";

  /** If true, only logs error message (`true` in "production" environment, unless provided otheriwse) */
  singleLineError?: boolean;
}

/*
const logger = new Logger()
logger.debug("This is a debug message");
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message: ", new Error("This is a Test"));

// Adding a custom log level
logger.addCustomLevel("trace", "\x1b[34m"); // Blue
logger.log("trace", "This is a trace message");
logger.log({ level: { name: "Test" }, hideLevel: true }, "Hi");
// Logging with a non-existing level
logger.log("nonexistent", "This should show as UNKNOWN"); */

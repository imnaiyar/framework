import { sendErrorLog } from "#src/utils/sendErrorLogs";
import { DateTime } from "luxon";
import util from "node:util";
import fs from "node:fs";

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

  /** Unicode emoji */
  emoji?: string;
};
export type LogLevels = "info" | "debug" | "warn" | "error";
class Logger {
  private levels: Map<string, LogLevel>;
  private timestamp = true;
  private singleLineError = true;
  private logToFile = false;
  constructor(private readonly options?: LoggerOption) {
    this.levels = new Map([
      ["debug", { name: "DEBUG", color: "\x1b[36m", emoji: "" }], // Cyan
      ["info", { name: "INFO", color: "\x1b[32m", emoji: "✔" }], // Green
      ["warn", { name: "WARN", color: "\x1b[33m", emoji: "⚠" }], // Yellow
      ["error", { name: "ERROR", color: "\x1b[31m", emoji: "☠" }], // Red
      ["custom", { name: "CUSTOM", color: "\x1b[35m" }], // Magenta, default custom level
    ]);
    if (options?.timestamp === false) this.timestamp = false;
    if (options?.env === "development") this.singleLineError = false;
    if (options?.singleLineError === false) this.singleLineError = false;
    if (options?.logToFile) this.logToFile = true;
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
    const includeTimestamp = typeof level === "object" && level.timestamp === false ? false : this.timestamp;
    if (logLevel) {
      let text = `${logLevel.emoji ? `${logLevel.emoji} ` : ""}[${logLevel.name}]`;
      if (logLevel.color) text = logLevel.color + text + "\x1b[0m";
      if (typeof level === "object" && level.hideLevel) text = "";
      if (includeTimestamp) text = "\x1b[90m" + date + "\x1b[0m" + " " + text;
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

  /**
   * Logs an error level event
   * @param content The error content to log
   * @param errorId The error ID
   * @returns The error ID
   */
  error(content: any, errorId?: string): string;

  /**
   * Logs an error level event
   * @param content The error message to log
   * @param err The error object
   * @param errorId The error ID
   * @returns The error ID
   */
  error(content: string, err: any, errorId?: string): string;

  error(content: any | string, err?: any, errorId?: string): string {
    errorId ??= typeof err === "string" ? err : crypto.randomUUID();
    const text =
      err && err instanceof Error ? content + ": " + err.message : content instanceof Error ? content.message : content;
    const colored = `\x1b[31m[${errorId}] ${text}\x1b[0m`;
    if (this.singleLineError) {
      this.log("error", colored);
    } else {
      err ? this.log("error", colored, "\n", err) : this.log("error", colored);
    }
    if (this.options?.errorWebhook) sendErrorLog(this.options.errorWebhook, content, err, errorId);
    if (this.logToFile) logErrorsToFile(errorId, err instanceof Error ? err : content, this.options?.timezone);
    return errorId;
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

  /**
   * Write errors to a log-file, it'll log all the errors in the "logs" folder, if there is no folder with such name, one will be created
   */
  logToFile?: boolean;
}

function logErrorsToFile(errorId: string, err: Error, timezone?: string): void {
  const date = DateTime.now().setZone(timezone).toFormat("dd LLL yyyy hh:mm:ss a");
  const formattedErrorString = `[${date}]: [${errorId}]`;
  const errorStringified = util.inspect(err, { depth: Infinity, colors: false });
  const joinedValue = `${formattedErrorString}:\n${errorStringified}\n` + "-".repeat(50) + "\n\n\n";
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");
  fs.appendFile(
    `logs/${DateTime.now().setZone(timezone).toFormat("dd LL yyyy").split(" ").join("-").trim()}.log`,
    joinedValue,
    (err) => {
      if (err) console.error("Failed to log error to file: ", err);
    },
  );
}

/* const logger = new Logger({ logToFile: true });
logger.debug("This is a debug message");
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message: ", new Error("This is a Test"));
logger.error("hello", "123");
logger.error("hello", new Error("hmmm"));
logger.error("hello", new Error("what the hell"), "123");
// Adding a custom log level
logger.addCustomLevel("trace", "\x1b[34m"); // Blue
logger.log("trace", "This is a trace message");
logger.log({ level: { name: "Test" }, hideLevel: true }, "Hi");
// Logging with a non-existing level
logger.log("nonexistent", "This should show as UNKNOWN"); */

export enum LogColors {
  Red = "\x1b[36m",
  Green = "\x1b[32m",
  Yellow = "\x1b[33m",
  Blue = "\x1b[34m",
  Magenta = "\x1b[35m",
  Cyan = "\x1b[36m",
  White = "\x1b[37m",
  Black = "\x1b[30m",
  Reset = "\x1b[0m",
}

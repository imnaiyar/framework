import { Logger, LoggerOption } from "../src/structures/Logger";
import { DateTime } from "luxon";

describe("Logger", () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log a debug message", () => {
    logger = new Logger();
    logger.debug("This is a debug message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[DEBUG]"), "This is a debug message");
  });

  it("should log an info message", () => {
    logger = new Logger();
    logger.info("This is an info message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "This is an info message");
  });

  it("should log a warning message", () => {
    logger = new Logger();
    logger.warn("This is a warning message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN]"), "This is a warning message");
  });

  it("should log an error message", () => {
    logger = new Logger();
    logger.error("This is an error message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[ERROR]"), "\x1b[31mThis is an error message\x1b[0m");
  });

  it("should log an error with an error object", () => {
    logger = new Logger();
    const error = new Error("This is a Test");
    logger.error("This is an error message:", error);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR]"),
      `\x1b[31mThis is an error message: This is a Test\x1b[0m`,
    );
  });

  it("should add and log with a custom level", () => {
    logger = new Logger();
    logger.addCustomLevel("trace", "\x1b[34m"); // Blue
    logger.log("trace", "This is a trace message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[TRACE]"), "This is a trace message");
  });

  it("should log with a custom level and hide level", () => {
    logger = new Logger();
    logger.log({ level: { name: "Test" }, hideLevel: true }, "Hi");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("["), expect.stringContaining("Hi"));
  });

  it("should log with a nonexistent level", () => {
    logger = new Logger();
    logger.log("nonexistent", "This should show as UNKNOWN");
    expect(consoleSpy).toHaveBeenCalledWith("This should show as UNKNOWN");
  });

  it("should log with a timestamp", () => {
    const options: LoggerOption = { timezone: "UTC" };
    logger = new Logger(options);
    const date = "[" + DateTime.now().setZone(options.timezone).toFormat("dd LLL yyyy hh:mm:ss a") + "]";
    logger.info("This is an info message");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("\x1b[90m" + date + "\x1b[0m \x1b[32m[INFO]\x1b[0m"),
      "This is an info message",
    );
  });

  it("should log without a timestamp", () => {
    const options: LoggerOption = { timestamp: false };
    logger = new Logger(options);
    logger.info("This is an info message");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO]"), "This is an info message");
  });
});

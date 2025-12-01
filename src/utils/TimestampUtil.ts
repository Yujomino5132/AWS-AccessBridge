class TimestampUtil {
  public static getCurrentUnixTimestampInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  public static addMinutes(timestamp: number, minutes: number): number {
    return timestamp + minutes * 60;
  }
}

export { TimestampUtil };

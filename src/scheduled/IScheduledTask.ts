abstract class IScheduledTask<TEnv extends IEnv> {
  constructor() {}

  public async handle(event: ScheduledController, env: TEnv, ctx: ExecutionContext): Promise<void> {
    // TODO: error handling
    return this.handleScheduledTask(event, env, ctx);
  }

  protected abstract handleScheduledTask(event: ScheduledController, env: TEnv, ctx: ExecutionContext): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IEnv {}

export { IScheduledTask };
export type { IEnv };

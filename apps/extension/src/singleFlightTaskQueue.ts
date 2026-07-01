export class SingleFlightTaskQueue {
  private activeTask: Promise<void> | null = null;
  private rerunRequested = false;

  public run(task: () => Promise<void>): Promise<void> {
    if (this.activeTask) {
      this.rerunRequested = true;
      return this.activeTask;
    }

    this.activeTask = this.drain(task);
    return this.activeTask;
  }

  private async drain(task: () => Promise<void>): Promise<void> {
    try {
      do {
        this.rerunRequested = false;
        await task();
      } while (this.rerunRequested);
    } finally {
      this.activeTask = null;
    }
  }
}

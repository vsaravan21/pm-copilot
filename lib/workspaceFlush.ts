let flushWorkspace: (() => void) | null = null;

export function registerWorkspaceFlush(fn: () => void): void {
  flushWorkspace = fn;
}

/** Persist workspace immediately (e.g. before opening agent in a new tab). */
export function flushWorkspaceToStorage(): void {
  flushWorkspace?.();
}

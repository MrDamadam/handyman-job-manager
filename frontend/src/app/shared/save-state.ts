import { OutputEmitterRef, signal } from '@angular/core';
import { catchError, EMPTY, MonoTypeOperatorFunction, tap } from 'rxjs';

/** The parent acknowledges the API result; the form owns its draft and feedback. */
export interface SaveRequest<T> {
  value: T;
  succeed(): void;
  fail(error: unknown): void;
}

export class SaveState {
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  submit<T>(value: T, output: Pick<OutputEmitterRef<SaveRequest<T>>, 'emit'>, onSuccess: () => void): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.saved.set(false);
    output.emit({
      value,
      succeed: () => {
        onSuccess();
        this.pending.set(false);
        this.saved.set(true);
      },
      fail: (error) => {
        this.pending.set(false);
        this.error.set(saveErrorMessage(error));
      },
    });
  }
}

export function saveErrorMessage(error: unknown): string {
  const response = error as { status?: number; error?: unknown } | null;
  if (response?.status === 0) return 'Unable to reach the server. Your input is still here; try again when connected.';
  const body = response?.error;
  if (body && typeof body === 'object') {
    const fields = body as Record<string, unknown>;
    if (typeof fields['error'] === 'string') return fields['error'];
    const messages = Object.entries(fields).filter(([, value]) => typeof value === 'string')
      .map(([field, value]) => `${field}: ${value}`);
    if (messages.length) return messages.join(' · ');
  }
  return 'Unable to save. Your input is still here; please try again.';
}

export function settleSave<T>(request: SaveRequest<unknown>): MonoTypeOperatorFunction<T> {
  return source => source.pipe(
    tap({ next: () => request.succeed() }),
    catchError(error => { request.fail(error); return EMPTY; }),
  );
}

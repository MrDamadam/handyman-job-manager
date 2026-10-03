import { Subject } from 'rxjs';
import { SaveRequest, SaveState, settleSave } from './save-state';

describe('save feedback', () => {
  it('keeps the draft on failure, prevents duplicate submission and resets only after a successful retry', () => {
    const state = new SaveState();
    let draft = 'Kitchen repair';
    const requests: SaveRequest<string>[] = [];
    const output = { emit: (request: SaveRequest<string>) => requests.push(request) };
    const reset = () => { draft = ''; };
    state.submit(draft, output, reset);
    state.submit(draft, output, reset);
    expect(requests.length).toBe(1);
    expect(state.pending()).toBe(true);
    const failed = new Subject<string>();
    failed.pipe(settleSave(requests[0])).subscribe();
    failed.error({ error: { title: 'Title is required' } });
    expect(draft).toBe('Kitchen repair');
    expect(state.pending()).toBe(false);
    expect(state.error()).toContain('Title is required');
    state.submit(draft, output, reset);
    expect(state.error()).toBeNull();
    const successful = new Subject<string>();
    successful.pipe(settleSave(requests[1])).subscribe();
    successful.next('saved');
    successful.complete();
    expect(draft).toBe('');
    expect(state.pending()).toBe(false);
    expect(state.saved()).toBe(true);
  });
});

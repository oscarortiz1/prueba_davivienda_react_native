import { useToastStore } from '../src/presentation/stores/toastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({
      message: '',
      type: 'info',
      visible: false,
    });
  });

  it('starts hidden with empty message', () => {
    const state = useToastStore.getState();
    expect(state.visible).toBe(false);
    expect(state.message).toBe('');
    expect(state.type).toBe('info');
  });

  it('shows a toast with custom message and type', () => {
    useToastStore.getState().showToast('Saved', 'success');

    const state = useToastStore.getState();
    expect(state.visible).toBe(true);
    expect(state.message).toBe('Saved');
    expect(state.type).toBe('success');
  });

  it('provides convenience helpers for each status', () => {
    useToastStore.getState().error('Oops');
    expect(useToastStore.getState()).toMatchObject({
      visible: true,
      type: 'error',
      message: 'Oops',
    });

    useToastStore.getState().hideToast();
    expect(useToastStore.getState().visible).toBe(false);
  });
});

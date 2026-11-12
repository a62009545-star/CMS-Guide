import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmOpts {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
}

const Ctx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        size="sm"
        footer={
          <>
            <Button onClick={() => close(false)}>Cancel</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)} data-autofocus>
              {state?.confirmLabel}
            </Button>
          </>
        }
      >
        <div className="text-sm text-ink-muted">{state?.body}</div>
      </Modal>
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);

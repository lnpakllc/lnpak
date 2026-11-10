import { createContext, useCallback, useContext, useState } from 'react';
import { Modal } from '../components/ui';
import LeadForm from '../components/LeadForm';

// Site-wide "Get Free Consultation" / "Apply Now" modal. Any button can open it with a pre-selected service.
const ConsultContext = createContext(() => {});

export function ConsultProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const open = useCallback((o = {}) => setOpts(o), []);
  const close = useCallback(() => setOpts(null), []);
  return (
    <ConsultContext.Provider value={open}>
      {children}
      <Modal open={!!opts} onClose={close} title={opts?.title || 'Get a Free Consultation'} size="max-w-xl">
        {opts && (
          <>
            <p className="mb-4 text-sm text-slate-500">{opts.subtitle || 'Share a few details and our consultant will contact you — the first assessment is free.'}</p>
            <LeadForm
              service={opts.service || 'general'}
              destination={opts.destination || ''}
              reference={opts.reference}
              formType={opts.formType || 'consultation_modal'}
              submitLabel={opts.submitLabel || 'Request Free Consultation'}
            />
          </>
        )}
      </Modal>
    </ConsultContext.Provider>
  );
}

export const useConsult = () => useContext(ConsultContext);

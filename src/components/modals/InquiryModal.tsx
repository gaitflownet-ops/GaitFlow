import { Modal } from "./Modal";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  type: "sale" | "breeding" | "general";
  subjectName: string;
};

export function InquiryModal({ open, onClose, type, subjectName }: Props) {
  const [sent, setSent] = useState(false);

  const titles = {
    sale: "Inquire about Sale",
    breeding: "Breeding Inquiry",
    general: "Contact Stable",
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  };

  if (sent) {
    return (
      <Modal open={open} onClose={onClose} title="Request Sent">
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg text-foreground mb-2">Thank you for your interest.</p>
          <p>A representative will contact you shortly regarding {subjectName}.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={titles[type]}>
      <form onSubmit={handleSend} className="mt-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          Please provide your contact information and any specific questions you have regarding{" "}
          <strong className="text-foreground">{subjectName}</strong>.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                First Name
              </label>
              <input
                required
                type="text"
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                Last Name
              </label>
              <input
                required
                type="text"
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                Email
              </label>
              <input
                required
                type="email"
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                Phone
              </label>
              <input
                type="tel"
                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Message
            </label>
            <textarea
              required
              rows={4}
              className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder={`I would like to request more information about ${subjectName}...`}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[var(--gold)] text-black font-medium text-sm hover:opacity-90 transition-opacity uppercase tracking-widest"
          >
            Send Inquiry
          </button>
        </div>
      </form>
    </Modal>
  );
}

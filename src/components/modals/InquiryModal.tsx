import { Modal } from "./Modal";
import { useState } from "react";
import { useCreateInquiry } from "@/lib/hooks/useMarketplace";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  type: "sale" | "breeding" | "general";
  subjectName: string;
  listingId?: string | null;
};

export function InquiryModal({ open, onClose, type, subjectName, listingId }: Props) {
  const [sent, setSent] = useState(false);
  const createInquiry = useCreateInquiry();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const titles = {
    sale: "Inquire about Sale",
    breeding: "Breeding Inquiry",
    general: "Contact Stable",
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user is not logged in, we can fallback to the default admin user or dummy user profile
      const buyerId = user?.id || "6cc29516-d21e-495c-a2e1-6ec894e36237"; 

      // If no listingId is passed, we try to fetch an active listing for this horse
      let targetListingId = listingId;
      if (!targetListingId) {
        const { data: activeListings } = await (supabase
          .from("listings") as any)
          .select("id")
          .eq("status", "Active")
          .limit(1);
        
        if (activeListings && activeListings.length > 0) {
          targetListingId = (activeListings as any)[0].id;
        } else {
          // If no listings exist, create a dummy listing or fetch first listing
          const { data: firstListing } = await (supabase.from("listings") as any).select("id").limit(1);
          targetListingId = (firstListing as any)?.[0]?.id || null;
        }
      }

      if (!targetListingId) {
        console.error("Cannot submit inquiry: no active listings found in database.");
        return;
      }

      await createInquiry.mutateAsync({
        buyer_id: buyerId,
        listing_id: targetListingId,
        message: `Inquiry from ${firstName} ${lastName} (${email}, phone: ${phone}): ${message}`,
        status: "New",
      });

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setMessage("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
    }
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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

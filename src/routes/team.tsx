import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { team } from "@/lib/data";
import { useState } from "react";
import { Mail, Phone, Plus, X } from "lucide-react";
import { Modal } from "@/components/modals/Modal";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — EquiSales" },
      { name: "description", content: "Owners, trainers, vets and farriers in one elegant place." },
    ],
  }),
  component: Team,
});

type TeamMember = (typeof team)[0];

function TeamMemberModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const [messageSent, setMessageSent] = useState(false);

  return (
    <Modal open onClose={onClose} size="lg">
      <div className="relative overflow-hidden rounded-t-[calc(var(--radius-3xl)-1px)] bg-gradient-to-br from-[oklch(0.22_0.04_155)] to-[oklch(0.18_0.018_60)] p-8 text-primary-foreground">
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.55_0.09_55)] text-charcoal font-display text-2xl">
            {member.initials}
          </div>
          <div>
            <h2 className="font-display text-3xl">{member.name}</h2>
            <p className="text-primary-foreground/70 mt-1">{member.role}</p>
            <p className="text-[var(--gold)] text-[13px] mt-1">{member.speciality}</p>
          </div>
        </div>
      </div>
      <div className="p-7 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, k: "Email", v: member.email },
            { icon: Phone, k: "Phone", v: member.phone },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="eyebrow">{k}</div>
                <div className="text-[14px] font-medium mt-0.5">{v}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="lux-card p-5">
          <div className="eyebrow mb-2">Last activity</div>
          <p className="text-[14px]">{member.last}</p>
          <p className="text-[12px] text-muted-foreground mt-1">Member since {member.since}</p>
        </div>

        {/* Message form */}
        {messageSent ? (
          <div className="rounded-2xl bg-primary/10 text-primary p-4 text-center text-[14px]">
            ✓ Message sent to {member.name}
          </div>
        ) : (
          <div>
            <label className="eyebrow block mb-1.5">Send message</label>
            <textarea
              className="lux-input resize-none"
              rows={3}
              placeholder={`Message ${member.name}…`}
              id={`message-${member.id}`}
            />
            <button
              id={`send-message-${member.id}`}
              onClick={() => setMessageSent(true)}
              className="mt-3 w-full rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-95"
            >
              Send message
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full rounded-full bg-secondary py-2.5 text-sm font-medium hover:bg-muted">
          Close
        </button>
      </div>
    </Modal>
  );
}

function Team() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <AppShell>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Collaboration</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Your team</h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-[15px]">
            Everyone who cares for the horses — connected to the same calm source of truth.
          </p>
        </div>
        <button
          id="invite-member-btn"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Invite
        </button>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map((m) => (
          <div key={m.name} className="lux-card p-6 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.82_0.12_80)] to-[oklch(0.36_0.07_50)] text-charcoal font-display text-lg">
                {m.initials}
              </div>
              <div>
                <div className="font-display text-xl leading-tight">{m.name}</div>
                <div className="text-[12px] text-muted-foreground">{m.role}</div>
                <div className="text-[11px] text-primary mt-0.5">{m.speciality}</div>
              </div>
            </div>
            <p className="mt-5 text-[13px] text-muted-foreground leading-relaxed">
              <span className="eyebrow block mb-1">Last activity</span>
              {m.last}
            </p>
            <div className="mt-5 hairline pt-4 flex gap-2">
              <button
                id={`message-btn-${m.id}`}
                onClick={() => setSelectedMember(m)}
                className="flex-1 rounded-full bg-secondary px-3 py-2 text-[12px] font-medium hover:bg-muted transition-colors"
              >
                Message
              </button>
              <button
                id={`view-activity-btn-${m.id}`}
                onClick={() => setSelectedMember(m)}
                className="flex-1 rounded-full bg-primary text-primary-foreground px-3 py-2 text-[12px] font-medium hover:opacity-95"
              >
                View profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Member detail modal */}
      {selectedMember && (
        <TeamMemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteSent(false); }} title="Invite team member">
          {inviteSent ? (
            <div className="p-10 text-center space-y-3">
              <div className="font-display text-2xl">Invitation sent</div>
              <p className="text-muted-foreground text-sm">
                We sent an invite to <strong>{inviteEmail}</strong>. They'll appear here once they join.
              </p>
              <button onClick={() => { setInviteOpen(false); setInviteSent(false); }} className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-95 mt-2">
                Done
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setInviteSent(true); }}
              className="p-7 space-y-5"
            >
              <div>
                <label className="eyebrow block mb-1.5">Email address</label>
                <input
                  type="email"
                  className="lux-input"
                  placeholder="trainer@stablename.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  id="invite-email"
                />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Role</label>
                <select className="lux-select" id="invite-role">
                  {["Trainer", "Veterinarian", "Farrier", "Rider", "Farm Manager"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setInviteOpen(false)} className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-medium hover:bg-muted">
                  Cancel
                </button>
                <button type="submit" id="send-invite-btn" className="flex-1 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-95">
                  Send invite
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      <div className="h-24 lg:h-12" />
    </AppShell>
  );
}

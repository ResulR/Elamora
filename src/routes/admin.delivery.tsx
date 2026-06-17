import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  createBlackoutDate,
  createDeliveryZone,
  createTimeSlot,
  deleteBlackoutDate,
  deleteDeliveryZone,
  deleteTimeSlot,
  fetchAdminDelivery,
  updateBlackoutDate,
  updateDeliveryZone,
  updateTimeSlot,
  type AdminDeliveryBlackoutDate,
  type AdminDeliveryTimeSlot,
  type AdminDeliveryZone,
  type DeliveryBlackoutPayload,
  type DeliveryTimeSlotPayload,
  type DeliveryZonePayload,
} from "@/lib/admin-delivery-api";

export const Route = createFileRoute("/admin/delivery")({
  head: () => ({ meta: [{ title: "Delivery — Admin" }] }),
  component: AdminDeliveryPage,
});

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyZone: DeliveryZonePayload = {
  name: "",
  countryCode: "BE",
  postalPattern: "",
  priceCents: 0,
  leadTimeDays: 0,
  isActive: true,
};

const emptyBlackout: DeliveryBlackoutPayload = {
  blackoutDate: "",
  countryCode: "",
  reason: "",
  isActive: true,
};

const emptySlot: DeliveryTimeSlotPayload = {
  name: "",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "22:00",
  countryCode: "",
  isActive: true,
  sortOrder: 1,
};

function AdminDeliveryPage() {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<AdminDeliveryBlackoutDate[]>([]);
  const [timeSlots, setTimeSlots] = useState<AdminDeliveryTimeSlot[]>([]);

  const [zoneForm, setZoneForm] = useState<DeliveryZonePayload>(emptyZone);
  const [blackoutForm, setBlackoutForm] = useState<DeliveryBlackoutPayload>(emptyBlackout);
  const [slotForm, setSlotForm] = useState<DeliveryTimeSlotPayload>(emptySlot);

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingBlackoutId, setEditingBlackoutId] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDelivery() {
    const delivery = await fetchAdminDelivery();
    setZones(delivery.zones);
    setBlackoutDates(delivery.blackoutDates);
    setTimeSlots(delivery.timeSlots);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);
        const delivery = await fetchAdminDelivery();

        if (!cancelled) {
          setZones(delivery.zones);
          setBlackoutDates(delivery.blackoutDates);
          setTimeSlots(delivery.timeSlots);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load delivery settings");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runAction(successMessage: string, action: () => Promise<void>) {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);
      await action();
      await loadDelivery();
      setNotice(successMessage);
    } catch (actionError) {
      console.error(actionError);
      setError(actionError instanceof Error ? actionError.message : "Could not save delivery settings");
    } finally {
      setIsSaving(false);
    }
  }

  const submitZone = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: DeliveryZonePayload = {
      ...zoneForm,
      name: zoneForm.name.trim(),
      countryCode: zoneForm.countryCode.trim().toUpperCase(),
      postalPattern: zoneForm.postalPattern.trim(),
      priceCents: Math.max(0, Math.round(Number(zoneForm.priceCents) || 0)),
      leadTimeDays: Math.max(0, Math.round(Number(zoneForm.leadTimeDays) || 0)),
    };

    void runAction(editingZoneId ? "Delivery zone updated." : "Delivery zone created.", async () => {
      if (editingZoneId) await updateDeliveryZone(editingZoneId, payload);
      else await createDeliveryZone(payload);
      setZoneForm(emptyZone);
      setEditingZoneId(null);
    });
  };

  const submitBlackout = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: DeliveryBlackoutPayload = {
      ...blackoutForm,
      countryCode: blackoutForm.countryCode.trim().toUpperCase(),
      reason: blackoutForm.reason.trim(),
    };

    void runAction(editingBlackoutId ? "Blackout date updated." : "Blackout date created.", async () => {
      if (editingBlackoutId) await updateBlackoutDate(editingBlackoutId, payload);
      else await createBlackoutDate(payload);
      setBlackoutForm(emptyBlackout);
      setEditingBlackoutId(null);
    });
  };

  const submitSlot = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: DeliveryTimeSlotPayload = {
      ...slotForm,
      name: slotForm.name.trim() || `${slotForm.startTime}-${slotForm.endTime}`,
      countryCode: slotForm.countryCode.trim().toUpperCase(),
      dayOfWeek: Math.min(6, Math.max(0, Math.round(Number(slotForm.dayOfWeek) || 0))),
      sortOrder: Math.max(0, Math.round(Number(slotForm.sortOrder) || 0)),
    };

    void runAction(editingSlotId ? "Time slot updated." : "Time slot created.", async () => {
      if (editingSlotId) await updateTimeSlot(editingSlotId, payload);
      else await createTimeSlot(payload);
      setSlotForm(emptySlot);
      setEditingSlotId(null);
    });
  };

  return (
    <AdminLayout title="Delivery">
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/25 px-5 py-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Manage delivery zones, blackout dates and delivery time slots from the admin panel.
            Postal patterns are matched by the API, so use values like <strong>10%</strong>, <strong>1000</strong> or <strong>12%</strong>.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-border/60 bg-surface/80 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">Loading delivery settings...</p>
          </div>
        ) : (
          <>
            <Section title="Delivery zones">
              <form onSubmit={submitZone} className="grid gap-3 lg:grid-cols-6">
                <Field label="Name" value={zoneForm.name} onChange={(v) => setZoneForm((f) => ({ ...f, name: v }))} required />
                <Field label="Country" value={zoneForm.countryCode} onChange={(v) => setZoneForm((f) => ({ ...f, countryCode: v }))} maxLength={2} required />
                <Field label="Postal pattern" value={zoneForm.postalPattern} onChange={(v) => setZoneForm((f) => ({ ...f, postalPattern: v }))} placeholder="10%" required />
                <Field label="Price cents" type="number" value={String(zoneForm.priceCents)} onChange={(v) => setZoneForm((f) => ({ ...f, priceCents: Number(v) || 0 }))} min={0} required />
                <Field label="Lead days" type="number" value={String(zoneForm.leadTimeDays)} onChange={(v) => setZoneForm((f) => ({ ...f, leadTimeDays: Number(v) || 0 }))} min={0} required />
                <Toggle label="Active" checked={zoneForm.isActive} onChange={(v) => setZoneForm((f) => ({ ...f, isActive: v }))} />
                <div className="lg:col-span-6 flex gap-2">
                  <SaveButton disabled={isSaving}>{editingZoneId ? "Update zone" : "Add zone"}</SaveButton>
                  {editingZoneId ? <CancelButton onClick={() => { setEditingZoneId(null); setZoneForm(emptyZone); }} /> : null}
                </div>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3">Postal pattern</th>
                      <th className="py-2 pr-3">Fee</th>
                      <th className="py-2 pr-3">Lead</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.id} className="border-t border-border/60">
                        <td className="py-3 pr-3">{zone.name}</td>
                        <td className="py-3 pr-3">{zone.countryCode}</td>
                        <td className="py-3 pr-3 font-mono text-xs">{zone.postalPattern}</td>
                        <td className="py-3 pr-3">€{(zone.priceCents / 100).toFixed(2)}</td>
                        <td className="py-3 pr-3">{zone.leadTimeDays}d</td>
                        <td className="py-3 pr-3">{zone.isActive ? "Yes" : "No"}</td>
                        <td className="py-3 pr-3">
                          <RowActions
                            onEdit={() => {
                              setEditingZoneId(zone.id);
                              setZoneForm({
                                name: zone.name,
                                countryCode: zone.countryCode,
                                postalPattern: zone.postalPattern,
                                priceCents: zone.priceCents,
                                leadTimeDays: zone.leadTimeDays,
                                isActive: zone.isActive,
                              });
                            }}
                            onDelete={() => {
                              if (!confirm(`Delete delivery zone “${zone.name}”?`)) return;
                              void runAction("Delivery zone deleted.", async () => deleteDeliveryZone(zone.id));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Blackout dates">
              <form onSubmit={submitBlackout} className="grid gap-3 lg:grid-cols-5">
                <Field label="Date" type="date" value={blackoutForm.blackoutDate} onChange={(v) => setBlackoutForm((f) => ({ ...f, blackoutDate: v }))} required />
                <Field label="Country optional" value={blackoutForm.countryCode} onChange={(v) => setBlackoutForm((f) => ({ ...f, countryCode: v }))} maxLength={2} placeholder="BE" />
                <Field label="Reason" value={blackoutForm.reason} onChange={(v) => setBlackoutForm((f) => ({ ...f, reason: v }))} />
                <Toggle label="Active" checked={blackoutForm.isActive} onChange={(v) => setBlackoutForm((f) => ({ ...f, isActive: v }))} />
                <div className="flex items-end gap-2">
                  <SaveButton disabled={isSaving}>{editingBlackoutId ? "Update" : "Add"}</SaveButton>
                  {editingBlackoutId ? <CancelButton onClick={() => { setEditingBlackoutId(null); setBlackoutForm(emptyBlackout); }} /> : null}
                </div>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3">Reason</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blackoutDates.map((blackout) => (
                      <tr key={blackout.id} className="border-t border-border/60">
                        <td className="py-3 pr-3">{blackout.blackoutDate}</td>
                        <td className="py-3 pr-3">{blackout.countryCode || "All"}</td>
                        <td className="py-3 pr-3">{blackout.reason || "—"}</td>
                        <td className="py-3 pr-3">{blackout.isActive ? "Yes" : "No"}</td>
                        <td className="py-3 pr-3">
                          <RowActions
                            onEdit={() => {
                              setEditingBlackoutId(blackout.id);
                              setBlackoutForm({
                                blackoutDate: blackout.blackoutDate,
                                countryCode: blackout.countryCode,
                                reason: blackout.reason,
                                isActive: blackout.isActive,
                              });
                            }}
                            onDelete={() => {
                              if (!confirm(`Delete blackout date ${blackout.blackoutDate}?`)) return;
                              void runAction("Blackout date deleted.", async () => deleteBlackoutDate(blackout.id));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Delivery time slots">
              <form onSubmit={submitSlot} className="grid gap-3 lg:grid-cols-8">
                <Field label="Name" value={slotForm.name} onChange={(v) => setSlotForm((f) => ({ ...f, name: v }))} placeholder="09:00-22:00" />
                <SelectDay value={slotForm.dayOfWeek} onChange={(v) => setSlotForm((f) => ({ ...f, dayOfWeek: v }))} />
                <Field label="Start" type="time" value={slotForm.startTime} onChange={(v) => setSlotForm((f) => ({ ...f, startTime: v }))} required />
                <Field label="End" type="time" value={slotForm.endTime} onChange={(v) => setSlotForm((f) => ({ ...f, endTime: v }))} required />
                <Field label="Country optional" value={slotForm.countryCode} onChange={(v) => setSlotForm((f) => ({ ...f, countryCode: v }))} maxLength={2} placeholder="BE" />
                <Field label="Sort" type="number" value={String(slotForm.sortOrder)} onChange={(v) => setSlotForm((f) => ({ ...f, sortOrder: Number(v) || 0 }))} min={0} required />
                <Toggle label="Active" checked={slotForm.isActive} onChange={(v) => setSlotForm((f) => ({ ...f, isActive: v }))} />
                <div className="flex items-end gap-2">
                  <SaveButton disabled={isSaving}>{editingSlotId ? "Update" : "Add"}</SaveButton>
                  {editingSlotId ? <CancelButton onClick={() => { setEditingSlotId(null); setSlotForm(emptySlot); }} /> : null}
                </div>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Day</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3">Sort</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => (
                      <tr key={slot.id} className="border-t border-border/60">
                        <td className="py-3 pr-3">{dayLabels[slot.dayOfWeek] ?? slot.dayOfWeek}</td>
                        <td className="py-3 pr-3">{slot.name}</td>
                        <td className="py-3 pr-3">{slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}</td>
                        <td className="py-3 pr-3">{slot.countryCode || "All"}</td>
                        <td className="py-3 pr-3">{slot.sortOrder}</td>
                        <td className="py-3 pr-3">{slot.isActive ? "Yes" : "No"}</td>
                        <td className="py-3 pr-3">
                          <RowActions
                            onEdit={() => {
                              setEditingSlotId(slot.id);
                              setSlotForm({
                                name: slot.name,
                                dayOfWeek: slot.dayOfWeek,
                                startTime: slot.startTime.slice(0, 5),
                                endTime: slot.endTime.slice(0, 5),
                                countryCode: slot.countryCode,
                                isActive: slot.isActive,
                                sortOrder: slot.sortOrder,
                              });
                            }}
                            onDelete={() => {
                              if (!confirm(`Delete time slot “${slot.name}” for ${dayLabels[slot.dayOfWeek]}?`)) return;
                              void runAction("Time slot deleted.", async () => deleteTimeSlot(slot.id));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface/80 p-5 shadow-soft">
      <h2 className="font-display text-lg mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
  min,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date" | "time";
  required?: boolean;
  maxLength?: number;
  min?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-full items-end gap-2 pb-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-primary"
      />
      {label}
    </label>
  );
}

function SelectDay({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Day</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {dayLabels.map((label, index) => (
          <option key={label} value={index}>{label}</option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
    >
      Cancel
    </button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onEdit} className="text-xs font-medium text-primary hover:underline">
        Edit
      </button>
      <button type="button" onClick={onDelete} className="text-xs font-medium text-destructive hover:underline">
        Delete
      </button>
    </div>
  );
}

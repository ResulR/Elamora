import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  fetchShippingAvailability,
  fetchShippingQuote,
  type ShippingAvailability,
  type ShippingQuote,
} from "@/lib/shipping-api";

export interface ShippingFormState {
  deliveryMethod: "pickup" | "delivery";
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryInstructions: string;
  recipientPhone: string;
}

interface ShippingPickerProps {
  value: ShippingFormState;
  onChange: (value: ShippingFormState) => void;
  onQuoteChange: (quote: ShippingQuote | null) => void;
}

function updateField(
  value: ShippingFormState,
  key: keyof ShippingFormState,
  fieldValue: string
): ShippingFormState {
  return {
    ...value,
    [key]: fieldValue,
  };
}

function tomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function ShippingPicker({ value, onChange, onQuoteChange }: ShippingPickerProps) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<ShippingAvailability | null>(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const canQuote =
    value.deliveryMethod === "delivery" &&
    value.postalCode.trim().length >= 2 &&
    value.country.trim().length === 2;

  const quoteUnavailable =
    value.deliveryMethod === "delivery" &&
    canQuote &&
    quote !== null &&
    !quote.available;

  const canCheckAvailability =
    value.deliveryMethod === "delivery" &&
    Boolean(value.deliveryDate) &&
    Boolean(quote?.available);

  const sundaySelected = false;

  useEffect(() => {
    if (value.deliveryMethod === "delivery" && !value.deliveryDate) {
      onChange({
        ...value,
        deliveryDate: tomorrowDate(),
        deliveryTimeSlot: "",
      });
    }
  }, [onChange, value]);

  useEffect(() => {
    if (!canCheckAvailability || sundaySelected) {
      setAvailability(null);
      setAvailabilityError(null);
      setIsAvailabilityLoading(false);
      return;
    }

    setIsAvailabilityLoading(true);
    setAvailabilityError(null);

    fetchShippingAvailability({
      date: value.deliveryDate,
      country: value.country,
    })
      .then((result) => {
        setAvailability(result);

        if (result.slots.length > 0 && !value.deliveryTimeSlot) {
          onChange({ ...value, deliveryTimeSlot: result.slots[0].value });
        }

        if (value.deliveryTimeSlot && !result.slots.some((slot) => slot.value === value.deliveryTimeSlot)) {
          onChange({ ...value, deliveryTimeSlot: "" });
        }
      })
      .catch((error) => {
        setAvailability(null);
        const message = error instanceof Error ? error.message : "";
        setAvailabilityError(
          message === "shipping_rate_limited"
            ? "Delivery slot check is temporarily limited. Please wait a moment and try again."
            : "Could not check delivery slots for this date. Please try another date."
        );
      })
      .finally(() => setIsAvailabilityLoading(false));
  }, [canCheckAvailability, onChange, sundaySelected, value]);

  useEffect(() => {
    setQuoteError(null);

    if (value.deliveryMethod !== "delivery") {
      setQuote(null);
      setAvailability(null);
      setAvailabilityError(null);
      setIsQuoteLoading(false);
      setIsAvailabilityLoading(false);
      onQuoteChange(null);
      return;
    }

    if (!canQuote) {
      setQuote(null);
      setAvailability(null);
      setAvailabilityError(null);
      setQuoteError(null);
      setIsQuoteLoading(false);
      setIsAvailabilityLoading(false);
      onQuoteChange(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsQuoteLoading(true);
      setQuoteError(null);

      fetchShippingQuote({
        postalCode: value.postalCode,
        country: value.country,
      })
        .then((result) => {
          setQuote(result);
          setQuoteError(null);
          onQuoteChange(result);

          if (!result.available) {
            setAvailability(null);
            setAvailabilityError(null);
            setIsAvailabilityLoading(false);
          }
        })
        .catch((error) => {
          setQuote(null);
          onQuoteChange(null);
          setAvailability(null);
          setAvailabilityError(null);
          setIsAvailabilityLoading(false);
          const message = error instanceof Error ? error.message : "";
          setQuoteError(
            message === "shipping_rate_limited"
              ? "Delivery check is temporarily limited. Please wait a moment and try again."
              : "Could not check delivery for this postal code. Please try again."
          );
        })
        .finally(() => setIsQuoteLoading(false));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [canQuote, onQuoteChange, value.country, value.deliveryMethod, value.postalCode]);

  return (
    <section className="bg-surface/80 border border-border/60 rounded-2xl p-6 shadow-soft">
      <h2 className="font-display text-xl mb-4">Delivery</h2>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/20">
          <input
            type="radio"
            name="deliveryMethod"
            className="mr-2"
            checked={value.deliveryMethod === "pickup"}
            onChange={() => onChange({ ...value, deliveryMethod: "pickup" })}
          />
          <span className="font-medium">Store pickup</span>
          <p className="text-xs text-muted-foreground mt-1">Free</p>
        </label>

        <label className="border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/20">
          <input
            type="radio"
            name="deliveryMethod"
            className="mr-2"
            checked={value.deliveryMethod === "delivery"}
            onChange={() =>
              onChange({
                ...value,
                deliveryMethod: "delivery",
                deliveryDate: value.deliveryDate || tomorrowDate(),
                deliveryTimeSlot: "",
              })
            }
          />
          <span className="font-medium">Delivery</span>
          <p className="text-xs text-muted-foreground mt-1">
            Calculated from your postal code
          </p>
        </label>
      </div>

      {value.deliveryMethod === "delivery" && (
        <div className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              name="addressLine1"
              label="Address line 1"
              placeholder="Street and number"
              required
              value={value.addressLine1}
              onChange={(v) => onChange(updateField(value, "addressLine1", v))}
              className="sm:col-span-2"
            />

            <Field
              name="addressLine2"
              label="Address line 2 — optional"
              placeholder="Apartment, floor, building"
              value={value.addressLine2}
              onChange={(v) => onChange(updateField(value, "addressLine2", v))}
              className="sm:col-span-2"
            />

            <Field
              name="postalCode"
              label="Postal code"
              placeholder="1000"
              required
              value={value.postalCode}
              onChange={(v) => onChange(updateField(value, "postalCode", v))}
            />

            <Field
              name="city"
              label="City"
              placeholder="Brussels"
              required
              value={value.city}
              onChange={(v) => onChange(updateField(value, "city", v))}
            />

            <div>
              <label
                htmlFor="country"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                value={value.country}
                onChange={(event) => onChange(updateField(value, "country", event.target.value))}
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="XK">Kosovo</option>
                <option value="BE">Belgium</option>
                <option value="FR">France</option>
              </select>
            </div>

            <Field
              name="recipientPhone"
              label="Recipient phone — optional"
              type="tel"
              placeholder="+32 470 00 00 00"
              value={value.recipientPhone}
              onChange={(v) => onChange(updateField(value, "recipientPhone", v))}
            />

            <Field
              name="deliveryDate"
              label="Delivery date — as soon as possible"
              type="date"
              min={tomorrowDate()}
              required
              value={value.deliveryDate}
              onChange={(v) => onChange({ ...updateField(value, "deliveryDate", v), deliveryTimeSlot: "" })}
            />

            <div>
              <label
                htmlFor="deliveryTimeSlot"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Delivery time slot
              </label>
              <select
                id="deliveryTimeSlot"
                name="deliveryTimeSlot"
                value={value.deliveryTimeSlot}
                disabled={!availability?.available || availability.slots.length === 0 || isAvailabilityLoading}
                onChange={(event) => onChange(updateField(value, "deliveryTimeSlot", event.target.value))}
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="">
                  {isAvailabilityLoading ? "Checking slots..." : "Choose a time slot"}
                </option>
                {availability?.slots.map((slot) => (
                  <option key={slot.id} value={slot.value}>
                    {slot.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="sm:col-span-2 text-xs text-muted-foreground">
              We automatically select the earliest available delivery date and time slot. You can change them if needed.
            </p>

            <div className="sm:col-span-2">
              <label
                htmlFor="deliveryInstructions"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Delivery instructions — optional
              </label>
              <textarea
                id="deliveryInstructions"
                name="deliveryInstructions"
                value={value.deliveryInstructions}
                onChange={(event) =>
                  onChange(updateField(value, "deliveryInstructions", event.target.value))
                }
                maxLength={500}
                rows={3}
                placeholder="Door code, preferred time window, safe place, etc."
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {value.deliveryInstructions.length}/500
              </p>
            </div>
          </div>

          {!sundaySelected && availabilityError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {availabilityError}
            </p>
          )}

          {!sundaySelected && availability && !availability.available && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No delivery slot is available for this date.
            </p>
          )}

          <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
            {isQuoteLoading ? (
              <p className="text-muted-foreground">Checking delivery fee...</p>
            ) : quoteError ? (
              <p className="text-destructive">{quoteError}</p>
            ) : quote?.available ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Delivery available</p>
                  <p className="text-xs text-muted-foreground">
                    {quote.zoneName}
                    {quote.leadTimeDays !== null ? ` · ${quote.leadTimeDays} day lead time` : ""}
                  </p>
                </div>
                <p className="font-display text-primary">
                  {formatPrice(quote.shippingCents)}
                </p>
              </div>
            ) : canQuote ? (
              <p className="text-destructive">
                This delivery area is not covered yet.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Enter your postal code to calculate delivery.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  className = "",
  min,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

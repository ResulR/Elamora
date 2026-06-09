import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { fetchShippingQuote, type ShippingQuote } from "@/lib/shipping-api";

export interface ShippingFormState {
  deliveryMethod: "pickup" | "delivery";
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryDate: string;
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

function isSunday(dateValue: string): boolean {
  if (!dateValue) return false;
  const date = new Date(`${dateValue}T12:00:00`);
  return date.getDay() === 0;
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

  const canQuote =
    value.deliveryMethod === "delivery" &&
    value.postalCode.trim().length >= 2 &&
    value.country.trim().length === 2;

  const sundaySelected = useMemo(
    () => value.deliveryMethod === "delivery" && isSunday(value.deliveryDate),
    [value.deliveryDate, value.deliveryMethod]
  );

  useEffect(() => {
    if (value.deliveryMethod !== "delivery") {
      setQuote(null);
      setQuoteError(null);
      setIsQuoteLoading(false);
      onQuoteChange(null);
      return;
    }

    if (!canQuote) {
      setQuote(null);
      setQuoteError(null);
      setIsQuoteLoading(false);
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
          onQuoteChange(result);
        })
        .catch(() => {
          setQuote(null);
          onQuoteChange(null);
          setQuoteError("Could not check delivery for this address.");
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
            onChange={() => onChange({ ...value, deliveryMethod: "delivery" })}
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Country
              </label>
              <select
                name="country"
                value={value.country}
                onChange={(event) => onChange(updateField(value, "country", event.target.value))}
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
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
              label="Preferred delivery date"
              type="date"
              min={tomorrowDate()}
              value={value.deliveryDate}
              onChange={(v) => onChange(updateField(value, "deliveryDate", v))}
              className="sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Delivery instructions — optional
              </label>
              <textarea
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

          {sundaySelected && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sunday delivery is not available. Please choose another date.
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
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
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

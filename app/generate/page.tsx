"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import type { ProductDescriptionOutput } from "@/app/api/generate-description/route";

// ── Constants ────────────────────────────────────────────────────────────────

const MARKETPLACES = ["Shopify", "Etsy", "Amazon", "eBay", "WooCommerce", "General e-commerce"];
const TONES = ["Professional", "Friendly & conversational", "Luxury & premium", "Fun & playful", "Minimalist"];
const LANGUAGES = [
  "English", "French", "Spanish", "German", "Italian",
  "Portuguese", "Dutch", "Polish", "Japanese", "Simplified Chinese",
];

const PHOTOROOM_URL =
  "https://www.photoroom.com/?utm_source=product-description-tool&utm_medium=cta&utm_campaign=listing-tool";

// ── Helpers ──────────────────────────────────────────────────────────────────

function useCopyButton() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return { copied, copy };
}

function CopyButton({ id, text, onCopy }: { id: string; text: string; onCopy: (id: string, text: string) => void; copied: string | null; }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- re-exported via onCopy
  return null; // placeholder — see CopyBtn below
}
void CopyButton;

function CopyBtn({
  id,
  text,
  copied,
  onCopy,
}: {
  id: string;
  text: string;
  copied: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const isCopied = copied === id;
  return (
    <button
      onClick={() => onCopy(id, text)}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
    >
      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Output block ─────────────────────────────────────────────────────────────

function OutputBlock({
  label,
  id,
  children,
  copyText,
  copied,
  onCopy,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  copyText: string;
  copied: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <CopyBtn id={id} text={copyText} copied={copied} onCopy={onCopy} />
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ── Form field ───────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [marketplace, setMarketplace] = useState("Shopify");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<ProductDescriptionOutput | null>(null);

  const { copied, copy } = useCopyButton();

  const selectClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  async function handleGenerate() {
    if (!productName.trim() || !sellingPoints.trim()) {
      setError("Please fill in the product name and at least one selling point.");
      return;
    }
    setError(null);
    setLoading(true);
    setOutput(null);

    // track generate event (plausible / GA4)
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).plausible) {
      (window as unknown as { plausible: (e: string) => void }).plausible("generate_description");
    }

    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, category, sellingPoints, marketplace, tone, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setOutput(data.output as ProductDescriptionOutput);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoroomClick() {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).plausible) {
      (window as unknown as { plausible: (e: string) => void }).plausible("photoroom_cta_click");
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            AI Product Description Generator
          </span>
          <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
            Free
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Hero ──────────────────────────────────────────── */}
        {!output && !loading && (
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Write product listings in seconds
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Enter your product details and get an SEO-optimised title, description, bullet points,
              and tags — ready to paste into any marketplace. No signup required.
            </p>
          </div>
        )}

        <div className={`gap-8 ${output ? "grid grid-cols-1 lg:grid-cols-[420px_1fr]" : ""}`}>
          {/* ── Form ──────────────────────────────────────────── */}
          <div
            className={`space-y-5 ${
              !output ? "max-w-xl mx-auto w-full" : ""
            }`}
          >
            <div className="rounded-xl border bg-card p-5 space-y-5">
              <Field label="Product name *">
                <input
                  className={inputClass}
                  placeholder="e.g. Handmade Soy Wax Candle"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </Field>

              <Field label="Category">
                <input
                  className={inputClass}
                  placeholder="e.g. Home & Living, Jewellery, Electronics…"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </Field>

              <Field
                label="Selling points *"
                hint="3–5 key features or benefits, comma-separated"
              >
                <textarea
                  className={`${inputClass} min-h-[90px] resize-none`}
                  placeholder="e.g. hand-poured, 50-hour burn time, eco-friendly soy wax, calming lavender scent"
                  value={sellingPoints}
                  onChange={(e) => setSellingPoints(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Marketplace">
                  <select
                    className={selectClass}
                    value={marketplace}
                    onChange={(e) => setMarketplace(e.target.value)}
                  >
                    {MARKETPLACES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Tone">
                  <select
                    className={selectClass}
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    {TONES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Language">
                  <select
                    className={selectClass}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate listing
                </>
              )}
            </button>
          </div>

          {/* ── Output ──────────────────────────────────────── */}
          {output && (
            <div className="space-y-4">
              <OutputBlock
                label="SEO Title"
                id="seo-title"
                copyText={output.seoTitle}
                copied={copied}
                onCopy={copy}
              >
                <p className="font-medium">{output.seoTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {output.seoTitle.length}/70 characters
                </p>
              </OutputBlock>

              <OutputBlock
                label="Meta Description"
                id="meta-desc"
                copyText={output.metaDescription}
                copied={copied}
                onCopy={copy}
              >
                <p>{output.metaDescription}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {output.metaDescription.length}/160 characters
                </p>
              </OutputBlock>

              <OutputBlock
                label="Product Description"
                id="full-desc"
                copyText={output.fullDescription}
                copied={copied}
                onCopy={copy}
              >
                <p className="whitespace-pre-wrap">{output.fullDescription}</p>
              </OutputBlock>

              <OutputBlock
                label="Bullet Points"
                id="bullets"
                copyText={output.bulletPoints.join("\n")}
                copied={copied}
                onCopy={copy}
              >
                <ul className="space-y-1.5">
                  {output.bulletPoints.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </OutputBlock>

              <OutputBlock
                label="Tags & Keywords"
                id="tags"
                copyText={output.tags.join(", ")}
                copied={copied}
                onCopy={copy}
              >
                <div className="flex flex-wrap gap-2">
                  {output.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </OutputBlock>

              {/* ── Photoroom CTA ────────────────────────────── */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                <p className="text-sm font-semibold">
                  Great description + great images = higher conversion
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your listing copy is ready. The next step is making your product photos
                  hit just as hard — remove backgrounds, add studio-quality scenes, and
                  create scroll-stopping images in seconds.
                </p>
                <a
                  href={PHOTOROOM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePhotoroomClick}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Try Photoroom free
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

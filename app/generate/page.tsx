"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ArrowRight, Loader2 } from "lucide-react";
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
      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
    >
      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
    <div className="py-7 border-t border-neutral-200 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
          {label}
        </span>
        <CopyBtn id={id} text={copyText} copied={copied} onCopy={onCopy} />
      </div>
      <div className="text-[15px] leading-relaxed text-neutral-800">{children}</div>
    </div>
  );
}

// ── Form field ───────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400 mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
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

  const inputClass =
    "w-full bg-transparent border-0 border-b border-neutral-200 px-0 py-2.5 text-[15px] text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors rounded-none";
  const selectClass =
    "w-full bg-transparent border-0 border-b border-neutral-200 px-0 py-2.5 text-[15px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none appearance-none cursor-pointer";

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
    <main className="min-h-screen bg-white text-neutral-900 antialiased">
      <div className="max-w-2xl mx-auto px-6 py-20">
        {/* ── Hero ──────────────────────────────────────────── */}
        <header className="mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-4">
            Free tool — no signup
          </p>
          <h1 className="text-4xl font-light tracking-tight leading-tight mb-4">
            Product listings,
            <br />
            written in seconds.
          </h1>
          <p className="text-neutral-500 leading-relaxed max-w-md">
            SEO title, description, bullet points and tags — ready to paste into
            any marketplace.
          </p>
        </header>

        {/* ── Form ──────────────────────────────────────────── */}
        <div className="space-y-8">
          <Field label="Product name *">
            <input
              className={inputClass}
              placeholder="Handmade Soy Wax Candle"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </Field>

          <Field label="Category">
            <input
              className={inputClass}
              placeholder="Home & Living, Jewellery, Electronics…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field>

          <Field label="Selling points *" hint="3–5 key features or benefits, comma-separated">
            <textarea
              className={`${inputClass} min-h-[80px] resize-none`}
              placeholder="hand-poured, 50-hour burn time, eco-friendly soy wax, calming lavender scent"
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Field label="Marketplace">
              <select className={selectClass} value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
                {MARKETPLACES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Tone">
              <select className={selectClass} value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Language">
              <select className={selectClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-600 border-l-2 border-red-600 pl-3">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="group inline-flex items-center gap-3 bg-neutral-900 text-white px-8 py-3.5 text-sm font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                Generate listing
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* ── Output ──────────────────────────────────────── */}
        {output && (
          <section className="mt-20">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-8">
              Your listing
            </p>

            <OutputBlock label="SEO Title" id="seo-title" copyText={output.seoTitle} copied={copied} onCopy={copy}>
              <p className="text-xl font-light">{output.seoTitle}</p>
              <p className="text-xs text-neutral-400 mt-2">{output.seoTitle.length}/70 characters</p>
            </OutputBlock>

            <OutputBlock label="Meta Description" id="meta-desc" copyText={output.metaDescription} copied={copied} onCopy={copy}>
              <p>{output.metaDescription}</p>
              <p className="text-xs text-neutral-400 mt-2">{output.metaDescription.length}/160 characters</p>
            </OutputBlock>

            <OutputBlock label="Product Description" id="full-desc" copyText={output.fullDescription} copied={copied} onCopy={copy}>
              <p className="whitespace-pre-wrap">{output.fullDescription}</p>
            </OutputBlock>

            <OutputBlock label="Bullet Points" id="bullets" copyText={output.bulletPoints.join("\n")} copied={copied} onCopy={copy}>
              <ul className="space-y-2">
                {output.bulletPoints.map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-neutral-300 select-none">—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </OutputBlock>

            <OutputBlock label="Tags & Keywords" id="tags" copyText={output.tags.join(", ")} copied={copied} onCopy={copy}>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {output.tags.map((tag, i) => (
                  <span key={i} className="text-sm text-neutral-500 border-b border-neutral-200 pb-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </OutputBlock>

            {/* ── Photoroom CTA ────────────────────────────── */}
            <div className="mt-12 pt-10 border-t border-neutral-900">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-4">
                Next step
              </p>
              <p className="text-xl font-light leading-snug mb-3">
                Great copy deserves great images.
              </p>
              <p className="text-neutral-500 leading-relaxed max-w-md mb-6">
                Remove backgrounds, add studio-quality scenes, and create
                scroll-stopping product photos in seconds.
              </p>
              <a
                href={PHOTOROOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePhotoroomClick}
                className="group inline-flex items-center gap-2 text-sm font-medium border-b border-neutral-900 pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
              >
                Try Photoroom free
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </section>
        )}

        <footer className="mt-24 pt-8 border-t border-neutral-100">
          <p className="text-xs text-neutral-300">AI Product Description Generator</p>
        </footer>
      </div>
    </main>
  );
}

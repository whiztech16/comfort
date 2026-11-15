import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserCircle2, Ghost } from "lucide-react";
import { PrimaryButton } from "../../components/shared/PrimaryButton";
import { useToast } from "../../hooks/useToast";
import { apiRequest, getUser } from "../../lib/api";

const MAX = 400;

const labelClass = "mb-2 block text-[0.8125rem] font-medium text-navy";

const baseField =
  "w-full rounded-2xl border border-transparent bg-[#f1f3fa] px-4 py-3 text-[0.9rem] text-navy outline-none transition placeholder:text-navy/40 focus:ring-2 focus:ring-brand/40";

type Category = { id: string; name: string };
type CategoryState = "loading" | "ready" | "error";

// Turn an API error into a readable message
function postErrorMessage(err: unknown): string {
  const e = err as { status?: number; message?: string } | null;
  if (!e?.status) return "Check your connection and try again.";
  if (e.status === 429) return "You're posting too fast. Please try again later.";
  if (e.status === 422) return "Please check your post and try again.";
  return e.message || "Failed to create post.";
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-[0.875rem] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
        active
          ? "border-brand-deep bg-brand-deep text-white"
          : "border-black/[0.1] bg-white text-navy/70 hover:bg-[#f1f3fa]"
      }`}
    >
      {children}
    </button>
  );
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = getUser();
  const displayName = user?.profile?.displayName ?? "Friend";

  const [body, setBody] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryState, setCategoryState] = useState<CategoryState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load categories; reloadKey lets the user retry
  useEffect(() => {
    let active = true;
    setCategoryState("loading");
    apiRequest<{ items: Category[] }>("/api/v1/categories")
      .then((res) => {
        if (!active) return;
        const cats = res.data?.items ?? [];
        setCategories(cats);
        setCategoryId((current) => current || cats[0]?.id || "");
        setCategoryState(cats.length > 0 ? "ready" : "error");
      })
      .catch(() => {
        if (active) setCategoryState("error");
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const bodyError =
    submitted && body.trim().length === 0 ? "Please write something before posting." : undefined;

  const remaining = MAX - body.length;
  const overLimit = remaining < 0;
  const canSubmit = !overLimit && !saving && categoryState === "ready" && Boolean(categoryId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!body.trim() || !canSubmit) return;

    setSaving(true);
    try {
      await apiRequest("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify({
          content: body.trim(),
          categoryId,
          isAnonymous: anonymous,
          visibility,
        }),
      });
      showToast("Your post is live 💙");
      navigate("/home");
    } catch (err: unknown) {
      showToast(postErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-navy">
          New post
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-navy/60">
          Share something kind, honest, or hopeful.
        </p>
      </section>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="post-body" className={labelClass}>
            What's on your mind?
          </label>
          <textarea
            id="post-body"
            rows={6}
            maxLength={MAX + 50}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write something kind, honest, or hopeful…"
            aria-invalid={Boolean(bodyError)}
            aria-describedby={bodyError ? "post-body-error" : undefined}
            className={`${baseField} resize-none ${bodyError ? "ring-2 ring-[#b4443a]/40" : ""}`}
          />
          <div className="mt-1 flex items-center justify-between px-1">
            {bodyError ? (
              <p id="post-body-error" role="alert" className="text-[0.8125rem] text-[#b4443a]">
                {bodyError}
              </p>
            ) : (
              <span />
            )}
            <span
              className={`text-[0.75rem] tabular-nums ${
                overLimit ? "text-[#b4443a]" : remaining <= 50 ? "text-amber-600" : "text-navy/40"
              }`}
            >
              {remaining}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="post-category" className={labelClass}>
            Category
          </label>
          {categoryState === "error" ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f1f3fa] px-4 py-3">
              <p role="alert" className="text-[0.8125rem] text-[#b4443a]">
                We couldn't load categories.
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-[0.8125rem] font-medium text-navy underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
              >
                Try again
              </button>
            </div>
          ) : (
            <select
              id="post-category"
              value={categoryId}
              disabled={categoryState === "loading"}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${baseField} cursor-pointer appearance-none disabled:opacity-60`}
            >
              {categoryState === "loading" && <option value="">Loading…</option>}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <p className={labelClass}>Visibility</p>
          <div className="flex gap-3">
            <OptionButton active={visibility === "public"} onClick={() => setVisibility("public")}>
              <Eye aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              Public
            </OptionButton>
            <OptionButton
              active={visibility === "private"}
              onClick={() => setVisibility("private")}
            >
              <EyeOff aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              Only me
            </OptionButton>
          </div>
          <p className="mt-2 px-1 text-[0.8125rem] text-navy/50">
            {visibility === "public"
              ? "Anyone on Comfort can read and send you a Comfort."
              : "Only you can see this post. Use it as a private journal."}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <label className="flex cursor-pointer items-start gap-4">
            <span
              role="checkbox"
              aria-checked={anonymous}
              tabIndex={0}
              onKeyDown={(e) => e.key === " " && setAnonymous((v) => !v)}
              onClick={() => setAnonymous((v) => !v)}
              className={`relative mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${
                anonymous ? "border-brand-deep bg-brand-deep" : "border-black/25 bg-white"
              }`}
            >
              {anonymous && (
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="absolute inset-0 m-auto h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-navy">
                {anonymous ? (
                  <Ghost aria-hidden className="h-4 w-4 text-brand-deep" strokeWidth={1.75} />
                ) : (
                  <UserCircle2 aria-hidden className="h-4 w-4 text-navy/50" strokeWidth={1.75} />
                )}
                Post anonymously
              </span>
              <span className="mt-0.5 block text-[0.8125rem] text-navy/55">
                {anonymous ? "Your name won't appear on this post." : `Posting as ${displayName}.`}
              </span>
            </div>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <PrimaryButton type="submit" className="w-full sm:w-auto" disabled={!canSubmit}>
            {saving ? "Posting…" : "Post"}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-12 rounded-full px-6 text-[0.9rem] font-medium text-navy/70 transition hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
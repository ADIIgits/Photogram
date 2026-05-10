/* SettingsPage.tsx — user profile settings.
 * Allows the authenticated user to update their display name, bio, and avatar.
 * Avatar changes are staged locally (shown as a preview) and only uploaded to
 * Cloudinary when the user explicitly hits "Save Changes".
 * Email is read-only (cannot be changed after signup). */

import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/features/auth/context";
import { Layout } from "@/components/shared/Layout";
import {
  useUpdateUser,
  useUploadImage,
  getGetMeQueryKey,
  getGetUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "saving" | "success" | "error";

export default function SettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const uploadImage = useUploadImage();

  /* Form field state */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  /* Avatar: avatarPreview is the current displayed URL or data-URL;
   * pendingFile is the File object waiting to be uploaded on save. */
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Populate form with current user data once it's loaded */
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setAvatarPreview(user.avatarUrl ?? null);
    }
  }, [user]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  /* When user picks a file: show a local data-URL preview immediately,
   * store the File object for upload when they confirm save. */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  /* On save: upload avatar (if new file), then PATCH the user profile */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");
    try {
      let avatarUrl: string | undefined;
      if (pendingFile) {
        /* Convert File to base64 data URL, then send to Cloudinary via API */
        const dataUrl = await fileToDataUrl(pendingFile);
        const res = await uploadImage.mutateAsync({ data: { dataUrl } });
        avatarUrl = res.url;
      }
      const updated = await updateUser.mutateAsync({
        id: user.id,
        data: {
          name: name.trim() || undefined,
          bio: bio.trim() || undefined,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      });
      /* Update both the /me cache and the individual user cache */
      queryClient.setQueryData(getGetMeQueryKey(), updated);
      queryClient.setQueryData(getGetUserQueryKey(user.id), updated);
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(user.id) });
      setPendingFile(null);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const isBusy = status === "saving";
  /* Derive initials for the avatar fallback */
  const initials = (user.name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: "var(--pg-bg)" }}>

        {/* ── Sticky frosted header ── */}
        <header
          className="sticky top-0 z-30 px-4 pt-4 pb-3 backdrop-blur-xl border-b"
          style={{ background: "var(--pg-bg-frosted)", borderColor: "var(--pg-border)" }}
        >
          <div className="max-w-xl mx-auto">
            <h1 className="text-[42px] font-black leading-none tracking-tighter" style={{ color: "var(--pg-text)" }}>
              Settings
            </h1>
            <p className="text-sm font-mono mt-0.5" style={{ color: "var(--pg-muted-text)" }}>
              Manage your profile
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 pt-6 pb-28 space-y-6">

          {/* ── Avatar section ── */}
          <section
            className="rounded-3xl p-5 border"
            style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: "var(--pg-muted-text)" }}>
              Profile Picture
            </p>
            <div className="flex items-center gap-5">
              {/* Clickable avatar circle — hover reveals camera icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-20 h-20 rounded-full overflow-hidden shrink-0 focus:outline-none border"
                style={{ background: "var(--pg-surface-hover)", borderColor: "var(--pg-border-strong)" }}
                aria-label="Change profile picture"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full font-serif text-xl" style={{ color: "var(--pg-muted-text)" }}>
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleAvatarChange}
              />

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium transition-opacity hover:opacity-70 underline underline-offset-2"
                  style={{ color: "var(--pg-text)" }}
                >
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </button>
                <p className="text-xs mt-1" style={{ color: "var(--pg-faint-text)" }}>
                  JPG, PNG or WebP · Max 5 MB
                </p>
                {/* Show the pending filename so user knows a file is staged */}
                {pendingFile && (
                  <p className="text-[11px] font-mono mt-1 truncate max-w-[200px]" style={{ color: "var(--pg-muted-text)" }}>
                    {pendingFile.name}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Account info section ── */}
          <section
            className="rounded-3xl p-5 space-y-4 border"
            style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--pg-muted-text)" }}>
              Account Info
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--pg-muted-text)" }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Your name"
                className="w-full h-11 px-4 rounded-2xl text-sm focus:outline-none transition-all border"
                style={{
                  background: "var(--pg-surface-hover)",
                  borderColor: "var(--pg-border)",
                  color: "var(--pg-text)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--pg-muted-text)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="A few words about you and your photography..."
                className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none transition-all resize-none leading-relaxed border"
                style={{
                  background: "var(--pg-surface-hover)",
                  borderColor: "var(--pg-border)",
                  color: "var(--pg-text)",
                }}
              />
              <p className="text-right text-[10px] font-mono" style={{ color: "var(--pg-faint-text)" }}>
                {bio.length}/300
              </p>
            </div>
          </section>

          {/* ── Email (read-only) ── */}
          <section
            className="rounded-3xl p-5 border"
            style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--pg-muted-text)" }}>
              Email
            </p>
            <div
              className="flex items-center justify-between h-11 px-4 rounded-2xl border"
              style={{ background: "var(--pg-surface)", borderColor: "var(--pg-border)" }}
            >
              <span className="text-sm" style={{ color: "var(--pg-muted-text)" }}>{user.email}</span>
              <span
                className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: "var(--pg-faint-text)", borderColor: "var(--pg-border)" }}
              >
                read-only
              </span>
            </div>
            <p className="text-xs mt-2 px-1" style={{ color: "var(--pg-faint-text)" }}>
              Email cannot be changed at this time.
            </p>
          </section>

          {/* ── Submit row with status feedback ── */}
          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-2 h-12 px-8 rounded-full font-semibold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: "var(--pg-btn-bg)", color: "var(--pg-btn-text)" }}
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {isBusy ? "Saving…" : "Save Changes"}
            </button>

            <AnimatePresence>
              {status === "success" && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </motion.span>
              )}
              {status === "error" && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-red-500"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </Layout>
  );
}

/* Converts a File object to a base64 data-URL string for the upload API */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

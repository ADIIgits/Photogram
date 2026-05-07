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
import { Camera, Loader2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

type Status = "idle" | "saving" | "success" | "error";

export default function SettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const updateUser = useUpdateUser();
  const uploadImage = useUploadImage();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      let avatarUrl: string | undefined;

      if (pendingFile) {
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

      queryClient.setQueryData(getGetMeQueryKey(), updated);
      queryClient.setQueryData(getGetUserQueryKey(user.id), updated);
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(user.id) });

      setPendingFile(null);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const isBusy = status === "saving";
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pt-8 md:pt-16 px-4 md:px-6 pb-24">
        <header className="mb-10">
          <h1 className="font-serif text-3xl mb-1 tracking-wide">Settings</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Manage your profile
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Avatar */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Profile Picture
            </h2>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-full bg-muted/40 border border-border overflow-hidden shrink-0 focus:outline-none"
                aria-label="Change profile picture"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full font-serif text-2xl text-muted-foreground">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleAvatarChange}
              />
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm underline text-foreground hover:text-muted-foreground transition-colors"
                >
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WebP · Max 5 MB
                </p>
                {pendingFile && (
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    {pendingFile.name}
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Name */}
          <section className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
              Account Info
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground block">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Your name"
                className="w-full bg-muted/20 border border-border focus:border-foreground/40 outline-none rounded-none px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground block">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="A few words about you and your photography..."
                className="w-full bg-muted/20 border border-border focus:border-foreground/40 outline-none rounded-none px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors resize-none"
              />
              <p className="text-right text-[11px] font-mono text-muted-foreground/60">
                {bio.length}/300
              </p>
            </div>
          </section>

          <hr className="border-border" />

          {/* Email (read-only) */}
          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
              Email
            </h2>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/10 border border-border/50">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 border border-border/40 px-1.5 py-0.5">
                read-only
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Email cannot be changed at this time.
            </p>
          </section>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 text-sm font-medium tracking-widest uppercase hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {isBusy ? "Saving…" : "Save Changes"}
            </button>

            {status === "success" && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            )}

            {status === "error" && (
              <span className="text-sm text-destructive">{errorMsg}</span>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

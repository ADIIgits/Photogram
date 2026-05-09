import { useRef, useState } from "react";
import {
  useCreatePost,
  useListCameras,
  useUploadImage,
  getGetFeedQueryKey,
  getListPostsQueryKey,
  getGetDiscoverQueryKey,
  getGetUserPostsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Loader2, X, Camera, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/context";

export function CreatePostModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [cameraId, setCameraId] = useState<string>("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const { data: cameras } = useListCameras();
  const uploadMutation = useUploadImage();
  const createMutation = useCreatePost();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loadFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  };

  const resetForm = () => {
    setTitle("");
    setCaption("");
    setCameraId("none");
    setImageFile(null);
    setImagePreview(null);
    setShowCameraSelect(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imagePreview) {
      toast({ title: "Error", description: "Title and image are required", variant: "destructive" });
      return;
    }
    try {
      const uploadRes = await uploadMutation.mutateAsync({ data: { dataUrl: imagePreview } });
      await createMutation.mutateAsync({
        data: {
          title,
          caption,
          imageUrl: uploadRes.url,
          cameraId: cameraId !== "none" ? parseInt(cameraId) : null,
        },
      });
      toast({ title: "Published", description: "Your photo is live." });
      handleClose();
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiscoverQueryKey() });
      if (user) queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(user.id) });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create post", variant: "destructive" });
    }
  };

  const selectedCamera = cameras?.find(c => c.id.toString() === cameraId);
  const isBusy = uploadMutation.isPending || createMutation.isPending;

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-24px)] max-w-md z-50 bg-[#111] border border-white/[0.08] rounded-[28px] overflow-hidden shadow-2xl shadow-black/60"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <h2 className="font-serif text-xl text-white font-medium">New Photograph</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Image dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] cursor-pointer group"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-sm text-white font-medium">
                          Change photo
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25 group-hover:text-white/40 transition-colors">
                      <ImageIcon className="w-10 h-10" strokeWidth={1.25} />
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/40">Drop photo here</p>
                        <p className="text-xs mt-0.5">or click to browse</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full h-11 px-4 bg-white/[0.05] border border-white/[0.07] rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-all font-medium"
                />

                {/* Caption */}
                <textarea
                  placeholder="The story behind this shot…"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.07] rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed"
                />

                {/* Camera selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCameraSelect(v => !v)}
                    className="w-full flex items-center justify-between h-11 px-4 bg-white/[0.05] border border-white/[0.07] rounded-2xl text-sm transition-all hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center gap-2 text-white/50">
                      <Camera size={14} strokeWidth={1.5} />
                      <span className={selectedCamera ? "text-white/80" : ""}>
                        {selectedCamera ? selectedCamera.name : "Camera (optional)"}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-white/30 transition-transform ${showCameraSelect ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showCameraSelect && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-10 max-h-48 overflow-y-auto no-scrollbar"
                      >
                        {[{ id: "none", name: "No camera specified" }, ...(cameras ?? []).map(c => ({ id: c.id.toString(), name: c.name }))].map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCameraId(c.id); setShowCameraSelect(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/[0.06] ${
                              cameraId === c.id ? "text-white font-medium" : "text-white/55"
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isBusy || !title || !imagePreview}
                  className="w-full h-12 bg-white text-black rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploadMutation.isPending ? "Uploading…" : createMutation.isPending ? "Publishing…" : "Develop & Publish"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState } from "react";
import { useCreatePost, useListCameras, useUploadImage, getGetFeedQueryKey, getListPostsQueryKey, getGetDiscoverQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Image as ImageIcon, Loader2 } from "lucide-react";

export function CreatePostModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [cameraId, setCameraId] = useState<string>("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!imageFile && !imagePreview)) {
      toast({ title: "Error", description: "Title and image are required", variant: "destructive" });
      return;
    }

    try {
      let imageUrl = "";
      if (imagePreview) {
        const uploadRes = await uploadMutation.mutateAsync({ data: { dataUrl: imagePreview } });
        imageUrl = uploadRes.url;
      }

      await createMutation.mutateAsync({
        data: {
          title,
          caption,
          imageUrl,
          cameraId: cameraId && cameraId !== "none" ? parseInt(cameraId) : null,
        },
      });

      toast({ title: "Success", description: "Post created successfully" });
      setOpen(false);
      setTitle("");
      setCaption("");
      setCameraId("none");
      setImageFile(null);
      setImagePreview(null);
      
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiscoverQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create post", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">New Output</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-4 opacity-50" />
                    <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs">PNG, JPG or WEBP</p>
                  </div>
                )}
                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-lg"
            />
            
            <Textarea
              placeholder="The story behind this shot..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary resize-none min-h-[80px]"
            />

            <Select value={cameraId} onValueChange={setCameraId}>
              <SelectTrigger className="bg-transparent border-border rounded-none border-0 border-b px-0 focus:ring-0">
                <SelectValue placeholder="Select Camera (Optional)" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                <SelectItem value="none">No camera specified</SelectItem>
                {cameras?.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id.toString()}>
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-none" 
            disabled={uploadMutation.isPending || createMutation.isPending}
          >
            {(uploadMutation.isPending || createMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Develop & Publish
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

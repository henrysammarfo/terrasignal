import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

const AvatarUpload = ({ userId, currentUrl, onUploaded }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    // Remove old avatar if exists
    await supabase.storage.from("avatars").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save to profile
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);

    onUploaded(publicUrl);
    setUploading(false);
    toast({ title: "Avatar updated", description: "Your profile picture has been saved." });
  };

  return (
    <div className="flex items-center gap-5">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center shrink-0 hover:border-primary/50 transition-colors"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold font-['Geist'] text-muted-foreground">?</span>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-background animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </button>
      <div>
        <p className="font-['Geist'] text-[14px] font-medium text-foreground">Profile Picture</p>
        <p className="font-['Geist'] text-[12px] text-muted-foreground mt-0.5">Click to upload · Max 2MB</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;

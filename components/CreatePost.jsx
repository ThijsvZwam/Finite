"use client";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setPosting(true);
    try {
      let image_url = null;

      // Upload image to R2 first if one is selected
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("type", "post");

        const uploadRes = await fetch("/api/post/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        image_url = uploadData.url;
      }

      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title: title || null, image_url }),
      });
      if (!res.ok) throw new Error();

      setContent("");
      setTitle("");
      setImage(null);
      setPreview(null);
      onPostCreated?.();

      window.location.reload();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="bg-transparent p-5">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-white text-2xl font-black placeholder-neutral-600 outline-none mb-4"
        maxLength={50}
      />
      <p className="text-xs text-zinc-500">({title.length}/50)</p>
      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full bg-transparent text-lg text-zinc-300 placeholder-neutral-500 outline-none resize-none leading-relaxed min-h-[120px]"
        maxLength={1000}
      />
      <p className="text-xs text-zinc-500">({content.length}/1000)</p>

      {preview && (
        <div className="relative w-fit mt-2">
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 rounded-xl object-cover border border-white/10"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-1.5 text-white hover:bg-red-500 transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-800/50">
        <label className="group cursor-pointer flex items-center gap-3 text-zinc-500 hover:text-primary-muted transition-all">
          <ImagePlus className="w-6 h-6" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
          <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Add image
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || posting}
          className="px-10 py-2.5 text-sm bg-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-20 text-white rounded-lg font-black transition-all shadow-lg shadow-primary-hover/20"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

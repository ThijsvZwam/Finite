"use client";
import Image from "next/image";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useState, useEffect } from "react";

function renderContent(content) {
  return content.replace(
    /#(\w+)/g,
    (match, tag) =>
      `<a href="/explore?q=${tag}" class="text-primary-muted hover:text-primary transition-colors">${match}</a>`,
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-black/70 border border-zinc-700 rounded-xl p-6 w-80 shadow-xl">
        <p className="text-sm text-white mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageModal({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all z-[120] border border-white/10"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt="Full view"
        className="relative max-w-7xl max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function CommentSection({ postId, currentUserId, onCommentAdded }) {
  const [comments, setComments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleDeleteComment(commentId) {
    setConfirmDelete({
      message: "Delete this comment?",
      onConfirm: async () => {
        setConfirmDelete(null);
        const res = await fetch(`/api/post/${postId}/comments/${commentId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setComments((c) => c.filter((c) => c.id !== commentId));
          onCommentAdded?.(-1);
        }
      },
    });
  }

  useEffect(() => {
    async function loadComments() {
      setLoading(true);
      try {
        const res = await fetch(`/api/post/${postId}/comments`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [postId]);

  async function handleComment() {
    if (!content.trim() || !currentUserId) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/post/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setComments((c) => [...(c ?? []), newComment]);
      setContent("");
      onCommentAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="w-20 h-2 bg-zinc-800 rounded" />
                <div className="w-full h-2 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {comments !== null && !loading && comments.length === 0 && (
        <p className="text-xs text-zinc-500">No comments yet.</p>
      )}

      {comments !== null &&
        !loading &&
        comments.map((comment) => (
          <div key={comment.id} className="flex gap-2 group">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              <Image
                src={comment.Users?.avatar_url ?? "/Default_Profile.jpg"}
                alt="avatar"
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <a
                    href={`/profile/${comment.Users?.username}`}
                    className="text-xs font-semibold text-white hover:underline"
                  >
                    {comment.Users?.display_name || comment.Users?.username}
                  </a>
                  <span className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">{comment.content}</p>
            </div>
          </div>
        ))}

      {currentUserId && (
        <div className="flex gap-2 pt-1">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            placeholder="Write a comment..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary"
          />
          <button
            onClick={handleComment}
            disabled={!content.trim() || posting}
            className="text-primary-muted hover:text-primary disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default function Post({ post, currentUserId }) {
  const [upvotes, setUpvotes] = useState(post.upvotes_count ?? 0);
  const [downvotes, setDownvotes] = useState(post.downvotes_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
  const [isImageOpen, setIsImageOpen] = useState(false);

  // In Post component
  const [confirmDelete, setConfirmDelete] = useState(null); // stores what to confirm

  async function handleDeletePost() {
    setConfirmDelete({
      message: "Delete this post?",
      onConfirm: async () => {
        setConfirmDelete(null);
        const res = await fetch(`/api/post/${post.id}`, { method: "DELETE" });
        if (res.ok) window.location.reload();
      },
    });
  }

  async function handleVote(type) {
    if (!currentUserId || voteLoading) return;
    setVoteLoading(true);

    // Save previous state for rollback
    const prevUp = upvotes;
    const prevDown = downvotes;
    const prevVote = userVote;

    // Optimistic update
    const isSameVote = userVote === type;
    if (isSameVote) {
      setUserVote(null);
      if (type === "up") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
    } else {
      if (userVote === "up") setUpvotes((v) => v - 1);
      if (userVote === "down") setDownvotes((v) => v - 1);
      setUserVote(type);
      if (type === "up") setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
    }

    try {
      const res = await fetch(`/api/post/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: isSameVote ? null : type }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Correct with real DB values
      setUserVote(data.user_vote);
      setUpvotes(data.upvotes_count);
      setDownvotes(data.downvotes_count);
    } catch (err) {
      // Rollback on failure
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
      console.error(err);
    } finally {
      setVoteLoading(false);
    }
  }

  const author = post.Users;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <div className="bg-black rounded-xl overflow-hidden border mb-4 border-zinc-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center p-4">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-zinc-700 shrink-0">
          <Image
            src={author?.avatar_url ?? "/Default_Profile.jpg"}
            alt="Avatar"
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex items-center justify-between w-full ml-3">
          <div>
            <a
              href={`/profile/${author?.username}`}
              className="text-sm font-semibold text-white tracking-wide hover:underline"
            >
              {author?.display_name || author?.username}
            </a>
            <div className="text-xs text-zinc-400">{timeAgo}</div>
          </div>
        </div>
      </div>
      {/* Title */}
      {post.title && (
        <div className="px-4 pb-2">
          <h2 className="text-base font-semibold text-white">{post.title}</h2>
        </div>
      )}
      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p
            className="text-sm text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
          />
        </div>
      )}
      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <div
            onClick={() => setIsImageOpen(true)}
            className="relative w-full h-112.5 group cursor-pointer overflow-hidden rounded-xl bg-zinc-900/40 border border-white/5"
          >
            {/* Background */}
            <img
              src={post.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110 transition duration-700 group-hover:opacity-40"
            />

            {/* Foreground */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={post.image_url}
                alt="Post content"
                className="max-w-full max-h-full object-contain shadow-2xl z-10 transition duration-300 group-hover:scale-[1.01]"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 z-10 group-hover:opacity-100 transition duration-200">
              <span className="bg-black/60 text-white text-sm font-bold px-6 py-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                View image
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="flex flex-row gap-6 items-center px-4 py-3 border-t border-zinc-800 text-zinc-400 text-sm font-medium">
        <button
          onClick={() => handleVote("up")}
          disabled={voteLoading}
          className={[
            "flex cursor-pointer items-center gap-1.5 transition-colors duration-200",
            userVote === "up" ? "text-emerald-500" : "hover:text-emerald-500",
          ].join(" ")}
        >
          <ArrowBigUp
            className={[
              "h-5 w-5",
              userVote === "up" ? "fill-emerald-500" : "",
            ].join(" ")}
          />
          <span>{upvotes}</span>
        </button>

        <button
          onClick={() => handleVote("down")}
          disabled={voteLoading}
          className={[
            "flex cursor-pointer items-center gap-1.5 transition-colors duration-200",
            userVote === "down" ? "text-rose-500" : "hover:text-rose-500",
          ].join(" ")}
        >
          <ArrowBigDown
            className={[
              "h-5 w-5",
              userVote === "down" ? "fill-rose-500" : "",
            ].join(" ")}
          />
          <span>{downvotes}</span>
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className={[
            "flex cursor-pointer items-center gap-1.5 transition-colors duration-200",
            showComments ? "text-sky-400" : "hover:text-sky-400",
          ].join(" ")}
        >
          <MessageCircle className="h-5 w-5" />
          <span>{commentsCount}</span>
        </button>

        {currentUserId === post.user_id && (
          <button
            onClick={handleDeletePost}
            className="ml-auto cursor-pointer text-zinc-600 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={(delta = 1) => setCommentsCount((c) => c + delta)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {isImageOpen && (
        <ImageModal
          src={post.image_url}
          onClose={() => setIsImageOpen(false)}
        />
      )}
    </div>
  );
}

export async function fetchProfile(username) {
  const res = await fetch(`/api/profile/${username}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Profile not found");
  return res.json();
}

export async function fetchFollowStatus(targetUserId) {
  const res = await fetch(
    `/api/profile/follow-status?target_user_id=${targetUserId}`,
  );
  if (!res.ok) return { following: false };
  return res.json(); // { following }
}

export async function followUser(targetUserId) {
  const res = await fetch("/api/profile/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function unfollowUser(targetUserId) {
  const res = await fetch("/api/profile/follow", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id: targetUserId }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function editProfile(updates) {
  const res = await fetch("/api/profile/edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// stub — wire up when image upload is ready
export async function uploadProfileImage(_file, _type) {
  throw new Error("Image upload not implemented yet");
}

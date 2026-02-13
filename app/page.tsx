"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  useEffect(() => {
    if (!user) return;

    fetchBookmarks();

    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchBookmarks()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const addBookmark = async () => {
    if (!title || !url) return alert("Please enter both title and URL");

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url, user_id: user.id }])
      .select();

    if (error) return console.error(error.message);

    setBookmarks([data[0], ...bookmarks]);
    setTitle("");
    setUrl("");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <button
          onClick={signInWithGoogle}
          className="btn btn-primary btn-lg shadow"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow-lg rounded-4 p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <div>
            <h1 className="h3 fw-bold">Smart Bookmark App</h1>
            <p className="text-muted mb-0">
              Logged in as: <span className="fw-medium">{user.email}</span>
            </p>
          </div>
          <button className="btn btn-danger" onClick={signOut}>
            Logout
          </button>
        </div>

        {/* Add Bookmark */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Bookmark Title"
            className="form-control mb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Bookmark URL"
            className="form-control mb-2"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="btn btn-success w-100" onClick={addBookmark}>
            Add Bookmark
          </button>
        </div>

        {/* Bookmark List */}
        {bookmarks.length === 0 ? (
          <p className="text-center text-muted">No bookmarks yet</p>
        ) : (
          <ul className="list-group">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div className="text-truncate" style={{ maxWidth: "80%" }}>
                  <strong>{bookmark.title}</strong>
                  <br />
                  <a href={bookmark.url} target="_blank" className="text-primary">
                    {bookmark.url}
                  </a>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => deleteBookmark(bookmark.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

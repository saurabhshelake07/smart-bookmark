"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Get current user & listen for auth changes
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const fetchInitial = async () => {
      await fetchBookmarks();
    };
    fetchInitial();

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
        async () => await fetchBookmarks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Add bookmark
  const addBookmark = async () => {
    if (!title || !url) {
      alert("Please enter both title and URL");
      return;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title, url, user_id: user.id }])
      .select();

    if (error) {
      console.error(error.message);
      return;
    }

    setBookmarks([data![0], ...bookmarks]);
    setTitle("");
    setUrl("");
  };

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  // Google login
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // If not logged in
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

  // Main UI
  return (
    <div className="container py-5">
      <div className="card shadow-lg rounded-4 p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h1 className="h3">Smart Bookmark App</h1>
            <p className="text-muted mb-0">
              Logged in as: <span className="fw-medium">{user.email}</span>
            </p>
          </div>
          <button onClick={signOut} className="btn btn-danger btn-sm">
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
          <button onClick={addBookmark} className="btn btn-success w-100">
            Add Bookmark
          </button>
        </div>

        {/* Bookmark List */}
        {bookmarks.length === 0 ? (
          <p className="text-center text-muted">No bookmarks yet</p>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-2 shadow-sm"
            >
              <div className="text-truncate">
                <p className="mb-1 fw-semibold">{bookmark.title}</p>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-truncate"
                >
                  {bookmark.url}
                </a>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="btn btn-outline-danger btn-sm ms-2"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

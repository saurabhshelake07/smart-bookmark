"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Get user and listen for auth changes
  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch bookmarks function
  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    // call async inside effect
    (async () => {
      await fetchBookmarks();
    })();

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
        async () => {
          await fetchBookmarks();
        }
      )
      .subscribe();

    // cleanup must be synchronous!
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

  // Login & Logout
  const signInWithGoogle = async () =>
    supabase.auth.signInWithOAuth({ provider: "google" });
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <button
          onClick={signInWithGoogle}
          className="btn btn-primary btn-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Smart Bookmark App</h3>
          <button className="btn btn-danger btn-sm" onClick={signOut}>
            Logout
          </button>
        </div>

        <input
          type="text"
          className="form-control mb-2"
          placeholder="Bookmark Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          className="form-control mb-2"
          placeholder="Bookmark URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button className="btn btn-success w-100" onClick={addBookmark}>
          Add Bookmark
        </button>

        {bookmarks.length === 0 ? (
          <p className="text-center text-muted mt-4">No bookmarks yet</p>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="d-flex justify-content-between align-items-center border rounded p-3 mt-3"
            >
              <div>
                <strong>{bm.title}</strong>
                <br />
                <a href={bm.url} target="_blank" rel="noopener noreferrer">
                  {bm.url}
                </a>
              </div>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => deleteBookmark(bm.id)}
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

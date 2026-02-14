"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Get current user & listen for auth changes (client-side only)
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch bookmarks (only after user is set)
  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setBookmarks(data || []);
    };

    fetchBookmarks();

    // Realtime subscription
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

    if (error) return console.error(error.message);

    setBookmarks([data![0], ...bookmarks]);
    setTitle("");
    setUrl("");
  };

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) return console.error(error.message);
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  // Login & Logout
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show login if not signed in
  if (!user) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <button
          onClick={signInWithGoogle}
          className="btn btn-primary btn-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3">Smart Bookmark App</h1>
            <p>Logged in as: {user.email}</p>
          </div>
          <button onClick={signOut} className="btn btn-danger btn-sm">
            Logout
          </button>
        </div>

        {/* Add Bookmark */}
        <div className="mb-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control mb-2"
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="form-control mb-2"
          />
          <button onClick={addBookmark} className="btn btn-success w-100">
            Add Bookmark
          </button>
        </div>

        {/* Bookmark List */}
        {bookmarks.length === 0 ? (
          <p>No bookmarks yet</p>
        ) : (
          bookmarks.map((b) => (
            <div
              key={b.id}
              className="d-flex justify-content-between border p-3 mb-2"
            >
              <div>
                <p>{b.title}</p>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.url}
                </a>
              </div>
              <button
                onClick={() => deleteBookmark(b.id)}
                className="btn btn-outline-danger btn-sm"
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

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Get current user on page load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth state changes (logout in another tab)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    // Cleanup function
    return () => {
      listener.subscription.unsubscribe(); // must be inside a function
    };
  }, []);

  // Fetch bookmarks for the current user
  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  // Realtime subscription for current user's bookmarks
  useEffect(() => {
    if (!user) return;

    fetchBookmarks(); // initial fetch

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

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Add a new bookmark
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

    setBookmarks([data![0], ...bookmarks]); // add to state
    setTitle("");
    setUrl("");
  };

  // Delete a bookmark
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

  // Show login if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightGray">
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Main app UI
  return (
    <div className="min-h-screen bg-lightGray py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-3xl p-8">

        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Smart Bookmark App</h1>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as: <span className="font-medium">{user.email}</span>
            </p>
          </div>

          <button
            onClick={signOut}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium shadow-md transition transform hover:scale-105"
          >
            Logout
          </button>
        </div>

        {/* Add Bookmark Section */}
        <div className="space-y-4 mb-8">
          <input
            type="text"
            placeholder="Bookmark Title"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Bookmark URL"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={addBookmark}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-105"
          >
            Add Bookmark
          </button>
        </div>

        {/* Bookmark List */}
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No bookmarks yet</p>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex justify-between items-center border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition transform hover:scale-[1.01]"
              >
                <div className="flex flex-col overflow-hidden">
                  <p className="font-semibold text-lg truncate">{bookmark.title}</p>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline truncate"
                  >
                    {bookmark.url}
                  </a>
                </div>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700 font-med

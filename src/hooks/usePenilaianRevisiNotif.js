"use client";

import { useState, useEffect, useCallback } from "react";

const usePenilaianRevisiNotif = () => {
  const [revisiList, setRevisiList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRevisi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/penilaian-revisi");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setRevisiList(data.data || []);
    } catch (err) {
      console.error("usePenilaianRevisiNotif fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setRevisiList((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch("/api/notifications/penilaian-revisi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("usePenilaianRevisiNotif markAsRead error:", err);
    }
  }, []);

  useEffect(() => {
    fetchRevisi();
  }, [fetchRevisi]);

  return { revisiList, loading, markAsRead };
};

export default usePenilaianRevisiNotif;

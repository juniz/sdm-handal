"use client";

import { useState, useEffect, useCallback } from "react";

const usePenilaianPendingNotif = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("kegiatan_pending_dismissed") === "true"
    ) {
      setIsDismissed(true);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/penilaian-pending");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setPendingList(data.data || []);
      }
    } catch (err) {
      console.error("usePenilaianPendingNotif fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const dismissItem = useCallback((tanggal) => {
    setPendingList((prev) => prev.filter((item) => item.tanggal !== tanggal));
  }, []);

  const dismissAll = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("kegiatan_pending_dismissed", "true");
      } catch (err) {
        console.error("usePenilaianPendingNotif sessionStorage error:", err);
      }
    }
  }, []);

  return {
    pendingList,
    loading,
    isDismissed,
    dismissItem,
    dismissAll,
    refetch: fetchPending,
  };
};

export default usePenilaianPendingNotif;

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { kindOf } from "@/lib/kinds";

const pending = new Map();
const ready = new Map();

function viewerRegion() {
  try {
    const tags = [...(navigator.languages || []), navigator.language];
    const region = tags.map((tag) => String(tag || "").split("-")[1]).find(Boolean);
    return /^[A-Za-z]{2}$/.test(region || "") ? region.toUpperCase() : "";
  } catch {
    return "";
  }
}

function keyOf(kind, externalId) {
  return `${kindOf(kind).key}:${externalId}`;
}

export function loadDetails(kind, externalId) {
  const key = keyOf(kind, externalId);

  if (!pending.has(key)) {
    const region = viewerRegion();
    const query = region ? `?region=${region}` : "";
    const request = api(`/${kindOf(kind).plural}/${encodeURIComponent(externalId)}/details${query}`).then(
      (data) => {
        ready.set(key, data);
        return data;
      },
      (error) => {
        pending.delete(key);
        throw error;
      },
    );

    pending.set(key, request);
  }

  return pending.get(key);
}

export function useDetails(kind, externalId) {
  const key = externalId ? keyOf(kind, externalId) : null;
  const [state, setState] = useState({ key: null, error: null });

  useEffect(() => {
    if (!key || ready.has(key)) return;

    let live = true;
    loadDetails(kind, externalId).then(
      () => live && setState({ key, error: null }),
      (error) => live && setState({ key, error }),
    );

    return () => {
      live = false;
    };
  }, [key, kind, externalId]);

  const data = key ? ready.get(key) || null : null;
  const error = !data && state.key === key ? state.error : null;

  return { data, error, loading: Boolean(key) && !data && !error };
}

export function ratingText(rating) {
  if (!rating) return null;
  return `${rating.value}/${rating.scale}`;
}

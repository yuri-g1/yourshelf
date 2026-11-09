import { useSyncExternalStore } from "react";

const STORAGE_KEY = "yourshelf-demo-v1";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.";

const initialState = {
  me: "u0",
  users: [
    { _id: "u0", name: "You" },
    { _id: "u1", name: "Lorem" },
    { _id: "u2", name: "Ipsum" },
    { _id: "u3", name: "Dolor" },
    { _id: "u4", name: "Amet" },
    { _id: "u5", name: "Consectetur" },
  ],
  movies: {
    u0: [
      { _id: "m1", title: "Lorem Ipsum", desc: LOREM },
      { _id: "m2", title: "Dolor Sit Amet", desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." },
      { _id: "m3", title: "Consectetur", desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse." },
      {
        _id: "m4",
        title: "Adipiscing Elit",
        desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa.",
        recommendedBy: "u1",
        recommendationText: "Lorem ipsum dolor sit amet, you will love the ending.",
      },
      {
        _id: "m5",
        title: "Sed Do Eiusmod",
        desc: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
        recommendedBy: "u2",
        recommendationText: "Nemo enim ipsam voluptatem, watch it on a rainy day.",
      },
    ],
    u1: [
      { _id: "m6", title: "Tempor Incididunt", desc: LOREM },
      { _id: "m7", title: "Magna Aliqua", desc: "Quis autem vel eum iure reprehenderit qui in ea voluptate." },
      { _id: "m8", title: "Ut Labore", desc: "At vero eos et accusamus et iusto odio dignissimos ducimus." },
    ],
    u2: [
      { _id: "m9", title: "Quis Nostrud", desc: LOREM },
      { _id: "m10", title: "Ullamco Laboris", desc: "Nam libero tempore, cum soluta nobis est eligendi optio." },
    ],
    u3: [{ _id: "m11", title: "Exercitation", desc: LOREM }],
    u4: [],
    u5: [{ _id: "m12", title: "Velit Esse", desc: "Temporibus autem quibusdam et aut officiis debitis." }],
  },
  relations: [
    { from: "u1", to: "u0", status: "accepted" },
    { from: "u0", to: "u2", status: "accepted" },
    { from: "u3", to: "u0", status: "pending" },
    { from: "u0", to: "u4", status: "pending" },
  ],
};

let state = null;
const listeners = new Set();

function readState() {
  if (state) return state;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state = saved ? JSON.parse(saved) : structuredClone(initialState);
  } catch {
    state = structuredClone(initialState);
  }

  return state;
}

function writeState(next) {
  state = next;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}

  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemo() {
  return useSyncExternalStore(subscribe, readState, () => initialState);
}

export function findUser(data, id) {
  return data.users.find((user) => user._id === id) || null;
}

export function findRelation(data, a, b) {
  return (
    data.relations.find(
      (relation) =>
        (relation.from === a && relation.to === b) ||
        (relation.from === b && relation.to === a),
    ) || null
  );
}

export function relationsOf(data, id) {
  return data.relations
    .filter((relation) => relation.from === id || relation.to === id)
    .map((relation) => ({
      ...relation,
      other: relation.from === id ? relation.to : relation.from,
      direction: relation.from === id ? "sent" : "received",
    }));
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export const demo = {
  reset() {
    writeState(structuredClone(initialState));
  },

  addMovie({ title, desc }) {
    const data = readState();

    if (!title?.trim()) throw new Error("Title is required");

    const movie = { _id: newId(), title: title.trim(), desc: desc?.trim() };
    writeState({
      ...data,
      movies: { ...data.movies, [data.me]: [movie, ...(data.movies[data.me] || [])] },
    });
  },

  removeMovie(movieId) {
    const data = readState();

    writeState({
      ...data,
      movies: {
        ...data.movies,
        [data.me]: (data.movies[data.me] || []).filter((movie) => movie._id !== movieId),
      },
    });
  },

  recommend(ownerId, { title, desc, note }) {
    const data = readState();

    if (!title?.trim()) throw new Error("Title is required");
    if (findRelation(data, data.me, ownerId)?.status !== "accepted") {
      throw new Error("Only friends can recommend movies");
    }

    const movie = {
      _id: newId(),
      title: title.trim(),
      desc: desc?.trim(),
      recommendedBy: data.me,
      recommendationText: note?.trim(),
    };

    writeState({
      ...data,
      movies: { ...data.movies, [ownerId]: [movie, ...(data.movies[ownerId] || [])] },
    });
  },

  sendRequest(userId) {
    const data = readState();
    const existing = findRelation(data, data.me, userId);

    if (existing && existing.status !== "denied") {
      throw new Error(`Relationship is already ${existing.status}`);
    }

    writeState({
      ...data,
      relations: [
        ...data.relations.filter((relation) => relation !== existing),
        { from: data.me, to: userId, status: "pending" },
      ],
    });
  },

  answer(userId, status) {
    const data = readState();
    const relation = findRelation(data, data.me, userId);

    if (!relation) throw new Error("Relationship not found");

    const canAnswer = relation.status === "pending" && relation.to === data.me;
    const canUndo = relation.status === "accepted" && status === "denied";

    if (!canAnswer && !canUndo) {
      throw new Error(`Cannot change from ${relation.status} to ${status}`);
    }

    writeState({
      ...data,
      relations: data.relations.map((item) =>
        item === relation ? { ...item, status } : item,
      ),
    });
  },
};

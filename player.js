"use strict";

const tracks = [
  { id: "afterglow", title: "Afterglow", mood: "Warm ambient", color: "#a8597e" },
  { id: "night-drive", title: "Night Drive", mood: "Retro synth", color: "#544bb3" },
  { id: "low-tide", title: "Low Tide", mood: "Soft downtempo", color: "#227e84" },
  { id: "orange-hour", title: "Orange Hour", mood: "Bright electronic", color: "#ac5734" },
  { id: "city-lights", title: "City Lights", mood: "Upbeat pulse", color: "#97533f" },
  { id: "quiet-orbit", title: "Quiet Orbit", mood: "Dreamy minimal", color: "#7256a3" },
];

const byId = (id) => document.getElementById(id);
const audio = byId("audio");
const search = byId("track-search");
const storageKey = "pulse-room-library";
let selected = -1;
let saved = new Set();

try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(stored)) saved = new Set(stored);
} catch {
  // The library still works in memory when browser storage is unavailable.
}

function playTrack(index) {
  selected = (index + tracks.length) % tracks.length;
  const track = tracks[selected];
  byId("now-playing").textContent = track.title;
  const status = byId("player-status");
  status.textContent = "";
  byId("previous").disabled = false;
  byId("next").disabled = false;
  audio.src = "./audio/" + track.id + ".wav";
  audio.play().catch((error) => {
    if (error.name !== "AbortError") status.textContent = "Playback could not start. Try the audio controls.";
  });
}

function makeCard(track) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = '<div class="cover" aria-hidden="true"></div><h3></h3><p></p><div class="card-actions"><button class="play" type="button">Play</button><button class="save" type="button">Save</button></div>';
  article.querySelector(".cover").style.setProperty("--cover", track.color);
  article.querySelector("h3").textContent = track.title;
  article.querySelector("p").textContent = track.mood;

  const play = article.querySelector(".play");
  play.setAttribute("aria-label", "Play " + track.title);
  play.addEventListener("click", () => playTrack(tracks.indexOf(track)));

  const save = article.querySelector(".save");
  save.dataset.track = track.id;
  save.setAttribute("aria-label", "Save " + track.title);
  save.setAttribute("aria-pressed", String(saved.has(track.id)));
  save.textContent = saved.has(track.id) ? "Saved" : "Save";
  save.addEventListener("click", () => {
    if (saved.has(track.id)) saved.delete(track.id);
    else saved.add(track.id);

    try {
      localStorage.setItem(storageKey, JSON.stringify([...saved]));
    } catch {
      // Keep the current library available for this visit.
    }

    document.querySelectorAll("#tracks .save").forEach((button) => {
      const isSaved = saved.has(button.dataset.track);
      button.textContent = isSaved ? "Saved" : "Save";
      button.setAttribute("aria-pressed", String(isSaved));
    });
    const fromLibrary = byId("saved-tracks").contains(save);
    renderLibrary();
    if (fromLibrary) {
      const fallback = [...byId("tracks").querySelectorAll(".save")]
        .find((button) => button.dataset.track === track.id);
      (fallback || search).focus();
    }
  });
  return article;
}

function renderDiscover() {
  const query = search.value.trim().toLowerCase();
  const matches = tracks.filter((track) => (track.title + " " + track.mood).toLowerCase().includes(query));
  byId("tracks").replaceChildren(...matches.map(makeCard));
  byId("search-status").textContent = matches.length ? "" : "No tracks found.";
}

function renderLibrary() {
  const favorites = tracks.filter((track) => saved.has(track.id));
  byId("empty-library").hidden = favorites.length > 0;
  byId("saved-tracks").replaceChildren(...favorites.map(makeCard));
}

search.addEventListener("input", renderDiscover);
byId("previous").addEventListener("click", () => playTrack(selected - 1));
byId("next").addEventListener("click", () => playTrack(selected + 1));
audio.addEventListener("error", () => {
  byId("player-status").textContent = "This track could not be loaded.";
});
renderDiscover();
renderLibrary();

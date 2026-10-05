"use client";

import { ExternalLink, Heart, MapPin, Star, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHOTO_TAP_EVENT, type PhotoTapDetail } from "@/components/PhotoCarousel";
import { RestaurantPhotos } from "@/components/RestaurantPhotos";
import type { Restaurant, Vote } from "@/types/bitematch";

const SWIPE_THRESHOLD = 110;
/** A press that moves less than this is a tap (flip photo), not a drag. */
const TAP_SLOP = 8;
const EXIT_MS = 240;

/**
 * The active restaurant card. Drag it left/right (mouse or touch), tap the
 * buttons, or use the arrow keys. The card flies off before the vote lands.
 */
export function SwipeDeck({
  restaurant,
  nextRestaurant,
  onVote
}: {
  restaurant: Restaurant;
  nextRestaurant?: Restaurant;
  onVote: (restaurantId: string, vote: Vote) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<Vote | null>(null);
  const start = useRef<{ x: number; y: number; target: Element } | null>(null);
  const travelled = useRef(0);

  const commit = useCallback(
    (vote: Vote) => {
      if (exiting) return;
      setExiting(vote);
      window.setTimeout(() => onVote(restaurant.id, vote), EXIT_MS);
    },
    [exiting, onVote, restaurant.id]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") commit("like");
      if (event.key === "ArrowLeft") commit("pass");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  const offset = exiting ? (exiting === "like" ? 1 : -1) * 900 : dragX;
  const rotation = offset / 22;
  const likeStrength = Math.min(Math.max(offset / SWIPE_THRESHOLD, 0), 1);
  const passStrength = Math.min(Math.max(-offset / SWIPE_THRESHOLD, 0), 1);

  return (
    <div className="swipe-deck">
      <div className="swipe-stack">
        {nextRestaurant ? (
          <div className="swipe-card swipe-card-behind" aria-hidden="true">
            <RestaurantCard restaurant={nextRestaurant} />
          </div>
        ) : null}
        <div
          className={`swipe-card${dragging ? " dragging" : ""}`}
          style={{ transform: `translateX(${offset}px) rotate(${rotation}deg)` }}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("a, button")) return;
            start.current = { x: event.clientX, y: event.clientY, target: event.target as Element };
            travelled.current = 0;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!start.current) return;
            travelled.current = Math.max(
              travelled.current,
              Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y)
            );
            setDragX(event.clientX - start.current.x);
          }}
          onPointerUp={(event) => {
            if (!start.current) return;
            const pressedOn = start.current.target;
            start.current = null;
            setDragging(false);
            if (travelled.current < TAP_SLOP) {
              // A tap on the photo flips it: right half = next, left half = previous.
              const carousel = pressedOn.closest("[data-photo-carousel]");
              if (carousel) {
                const box = carousel.getBoundingClientRect();
                const side = event.clientX < box.left + box.width / 2 ? "prev" : "next";
                carousel.dispatchEvent(new CustomEvent<PhotoTapDetail>(PHOTO_TAP_EVENT, { detail: { side } }));
              }
              setDragX(0);
              return;
            }
            if (dragX > SWIPE_THRESHOLD) commit("like");
            else if (dragX < -SWIPE_THRESHOLD) commit("pass");
            else setDragX(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragging(false);
            setDragX(0);
          }}
        >
          <span className="drag-stamp drag-stamp-like" style={{ opacity: likeStrength }}>
            Like
          </span>
          <span className="drag-stamp drag-stamp-pass" style={{ opacity: passStrength }}>
            Pass
          </span>
          <RestaurantCard restaurant={restaurant} />
        </div>
      </div>

      <div className="vote-actions">
        <button className="pass-button" onClick={() => commit("pass")} aria-label={`Pass on ${restaurant.name}`}>
          <X size={24} />
          Pass
        </button>
        <button className="like-button" onClick={() => commit("like")} aria-label={`Like ${restaurant.name}`}>
          <Heart size={24} />
          Like
        </button>
      </div>
      <p className="swipe-tip">
        Tap the photo to see more · drag the card to vote
      </p>
    </div>
  );
}

/** 1234 → "1.2k", 87 → "87" */
function formatCount(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count);
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-art">
        <RestaurantPhotos restaurant={restaurant} sizes="(max-width: 900px) 92vw, 560px" />
        <span className="price-sticker">{restaurant.price}</span>
      </div>
      <div className="restaurant-content">
        <div className="restaurant-title">
          <span className="restaurant-meta">{restaurant.cuisine}</span>
          <h3>{restaurant.name}</h3>
        </div>
        {/* Live listings only have a generic sentence here, so skip it and give the photo the room. */}
        {restaurant.source === "google" ? null : <p>{restaurant.vibe}</p>}
        <div className="detail-grid">
          <span>
            <MapPin size={15} />
            {restaurant.neighborhood} · {restaurant.distance.toFixed(1)} mi
          </span>
          {restaurant.rating > 0 ? (
            <span aria-label={`Rated ${restaurant.rating.toFixed(1)}${restaurant.reviewCount ? ` from ${restaurant.reviewCount} reviews` : ""}`}>
              <Star size={15} />
              {restaurant.rating.toFixed(1)}
              {restaurant.reviewCount ? ` (${formatCount(restaurant.reviewCount)})` : ""}
            </span>
          ) : (
            <span>Live listing</span>
          )}
          {restaurant.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <a
          className="map-link"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            restaurant.mapQuery
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={16} />
          <span>{restaurant.address}</span>
          <ExternalLink size={15} />
        </a>
      </div>
    </article>
  );
}

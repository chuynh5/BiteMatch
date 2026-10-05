"use client";

import { ExternalLink, Heart, MapPin, Star, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DishArt } from "@/components/DishArt";
import { FoodImage } from "@/components/FoodImage";
import type { Restaurant, Vote } from "@/types/bitematch";

const SWIPE_THRESHOLD = 110;
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
  const start = useRef<{ x: number; y: number } | null>(null);

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
            start.current = { x: event.clientX, y: event.clientY };
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!start.current) return;
            setDragX(event.clientX - start.current.x);
          }}
          onPointerUp={() => {
            if (!start.current) return;
            start.current = null;
            setDragging(false);
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
      <p className="swipe-tip">Drag the card, or use ← → keys</p>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="restaurant-card">
      <div className="restaurant-art">
        <DishArt restaurant={restaurant} sizes="(max-width: 900px) 92vw, 560px" />
        <span className="price-sticker">{restaurant.price}</span>
      </div>
      <div className="restaurant-content">
        <div className="restaurant-title">
          <span className="restaurant-meta">{restaurant.cuisine.toLowerCase()}</span>
          <h3>{restaurant.name}</h3>
        </div>
        <p>{restaurant.vibe}</p>
        <div className="detail-grid">
          <span>
            <MapPin size={15} />
            {restaurant.neighborhood} · {restaurant.distance.toFixed(1)} mi
          </span>
          {restaurant.rating > 0 ? (
            <span>
              <Star size={15} />
              {restaurant.rating}
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
        {restaurant.source === "google" && restaurant.menuImages.length > 0 ? (
          <div className="menu-preview" aria-label={`${restaurant.name} menu photos`}>
            {restaurant.menuImages.map((photo) => (
              <div className="menu-photo" key={photo.src}>
                <FoodImage
                  src={photo.src}
                  alt={photo.alt}
                  cuisine={restaurant.cuisine}
                  unoptimized={restaurant.source === "google"}
                  sizes="130px"
                />
              </div>
            ))}
          </div>
        ) : null}
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

"use client";

import { ArrowRight, MapPin, SlidersHorizontal, Timer } from "lucide-react";
import { DEADLINE_OPTIONS, deadlineLabel } from "@/lib/deadline";
import { cuisineOptions, priceOptions } from "@/data/restaurants";
import type { Cuisine, Preferences, PriceLevel, Restaurant } from "@/types/bitematch";

export type LocationStatus = "idle" | "locating" | "live" | "fallback" | "error";

export function Setup({
  name,
  setName,
  preferences,
  setPreferences,
  onCuisineToggle,
  onPriceToggle,
  onUseLocation,
  locationStatus,
  locationMessage,
  isPlacesConfigured,
  restaurantOptions,
  submitLabel,
  submitting = false,
  submitError,
  showDeadline = false,
  onSubmit
}: {
  name: string;
  setName: (name: string) => void;
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  onCuisineToggle: (cuisine: Cuisine) => void;
  onPriceToggle: (price: PriceLevel) => void;
  onUseLocation: () => void;
  locationStatus: LocationStatus;
  locationMessage: string;
  isPlacesConfigured: boolean;
  /** The restaurants currently loaded (demo or live), used for the availability hint. */
  restaurantOptions: Restaurant[];
  submitLabel: string;
  submitting?: boolean;
  submitError?: string | null;
  /** Show the voting deadline picker (real rooms only, not the demo). */
  showDeadline?: boolean;
  onSubmit: () => void;
}) {
  const unavailableCuisines = preferences.cuisines.filter(
    (cuisine) =>
      !restaurantOptions.some(
        (restaurant) =>
          restaurant.cuisine === cuisine &&
          preferences.prices.includes(restaurant.price) &&
          restaurant.distance <= preferences.maxDistance
      )
  );

  return (
    <div className="setup-grid">
      <section className="setup-panel intro-panel">
        <div className="section-kicker">
          <SlidersHorizontal size={17} />
          Room setup
        </div>
        <h2>Build a dinner room your friends can answer fast.</h2>
        <p>Pick your vibe. Share the code. Find the match.</p>

        <label className="input-label" htmlFor="name">
          Your display name
        </label>
        <input
          id="name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
        />

        <ol className="setup-steps" aria-label="How it works">
          <li>
            <strong>Set the filters</strong>
            <span>Cuisine, price and how far you&apos;ll go.</span>
          </li>
          <li>
            <strong>Share the code</strong>
            <span>Friends join and vote privately.</span>
          </li>
          <li>
            <strong>Get the match</strong>
            <span>The place everyone liked is revealed.</span>
          </li>
        </ol>
      </section>

      <section className="setup-panel">
        <div className="section-kicker">Preferences</div>
        <div className="control-block">
          <h3>Cuisine</h3>
          <div className="chip-grid">
            {cuisineOptions.map((cuisine) => (
              <button
                key={cuisine}
                className={preferences.cuisines.includes(cuisine) ? "chip selected" : "chip"}
                aria-pressed={preferences.cuisines.includes(cuisine)}
                onClick={() => onCuisineToggle(cuisine)}
              >
                {cuisine}
              </button>
            ))}
          </div>
          {unavailableCuisines.length > 0 ? (
            <div className="availability-note">
              <strong>Heads up</strong>
              <span>
                No {unavailableCuisines.join(", ")} restaurants match the current
                price range within {preferences.maxDistance.toFixed(1)} mi.
              </span>
            </div>
          ) : null}
        </div>

        <div className="control-block">
          <h3>Price</h3>
          <div className="segmented-control">
            {priceOptions.map((price) => (
              <button
                key={price}
                className={preferences.prices.includes(price) ? "selected" : undefined}
                aria-pressed={preferences.prices.includes(price)}
                onClick={() => onPriceToggle(price)}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        <div className="control-block">
          <div className="range-heading">
            <h3>Distance</h3>
            <span>{preferences.maxDistance.toFixed(1)} mi</span>
          </div>
          <input
            className="range"
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={preferences.maxDistance}
            aria-label="Maximum distance in miles"
            onChange={(event) =>
              setPreferences({
                ...preferences,
                maxDistance: Number(event.target.value)
              })
            }
          />
        </div>

        {showDeadline ? (
          <div className="control-block">
            <div className="range-heading">
              <h3>Voting deadline</h3>
              <Timer size={17} aria-hidden="true" />
            </div>
            <div className="segmented-control deadline-control" role="group" aria-label="Voting deadline">
              {DEADLINE_OPTIONS.map((minutes) => {
                const selected = (preferences.deadlineMinutes ?? null) === minutes;
                return (
                  <button
                    key={minutes ?? "none"}
                    className={selected ? "selected" : undefined}
                    aria-pressed={selected}
                    onClick={() => setPreferences({ ...preferences, deadlineMinutes: minutes })}
                  >
                    {deadlineLabel(minutes)}
                  </button>
                );
              })}
            </div>
            <p className="control-hint">
              {preferences.deadlineMinutes
                ? `If someone hasn't voted after ${preferences.deadlineMinutes} minutes, the group's top pick wins.`
                : "The room waits until everyone has voted."}
            </p>
          </div>
        ) : null}

        <div className="location-box">
          <div>
            <span>Restaurant source</span>
            <p>{locationMessage}</p>
          </div>
          <button
            className="secondary-button"
            onClick={onUseLocation}
            disabled={locationStatus === "locating"}
          >
            <MapPin size={17} />
            {locationStatus === "locating"
              ? "Finding..."
              : isPlacesConfigured
                ? "Use my location"
                : "Use location via OSM"}
          </button>
        </div>

        {submitError ? (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <button className="primary-button full setup-submit" onClick={onSubmit} disabled={submitting}>
          {submitLabel}
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}

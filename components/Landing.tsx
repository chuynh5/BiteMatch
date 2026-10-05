"use client";

import { Clock3, Heart, PartyPopper, Plus, Search, Sparkles, Users, X } from "lucide-react";
import { restaurants } from "@/data/restaurants";
import { DishArt } from "@/components/DishArt";

export type JoinNotice = {
  title: string;
  message: string;
};

const byId = (id: string) => restaurants.find((restaurant) => restaurant.id === id) ?? restaurants[0];

// The last card is the one the animation "matches" on.
const prototypeRestaurants = ["mida", "kaju", "greco", "gourmet-dumpling", "tora"].map(byId);

export function Landing({
  onCreate,
  onDemo,
  joinCode,
  setJoinCode,
  onJoinRoom,
  joinNotice,
  onDismissJoinNotice
}: {
  onCreate: () => void;
  onDemo: () => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  onJoinRoom: (code: string) => void;
  joinNotice: JoinNotice | null;
  onDismissJoinNotice: () => void;
}) {
  return (
    <div className="landing">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={16} />
          A calmer way to pick a table
        </div>
        <h1>
          Dinner plans, <em>made easy.</em>
        </h1>
        <p>
          BiteMatch lets everyone quietly vote on restaurants, then shows the
          place your group can actually agree on.
        </p>
        <div className="hero-actions">
          <button className="primary-button large" onClick={onCreate}>
            Create a Group
            <Plus size={19} />
          </button>
          <button className="secondary-button large" onClick={onDemo}>
            Try the Demo Room
          </button>
        </div>
        <form
          className="home-join"
          onSubmit={(event) => {
            event.preventDefault();
            onJoinRoom(joinCode);
          }}
        >
          <label htmlFor="home-room-code">Join a Room</label>
          <div className="home-join-row">
            <input
              id="home-room-code"
              className="text-input"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Room code"
              inputMode="numeric"
            />
            <button className="secondary-button" type="submit">
              Join
              <Search size={16} />
            </button>
          </div>
          {joinNotice ? (
            <div className="join-notice" role="status">
              <div>
                <strong>{joinNotice.title}</strong>
                <span>{joinNotice.message}</span>
              </div>
              <button type="button" onClick={onDismissJoinNotice} aria-label="Dismiss room message">
                <X size={14} />
              </button>
            </div>
          ) : null}
        </form>
        <div className="metric-strip" aria-label="Product highlights">
          <span>
            <Clock3 size={17} />
            Under 5 Minutes
          </span>
          <span>
            <Users size={17} />
            2-5 Friends
          </span>
          <span>
            <Heart size={17} />
            Private Voting
          </span>
        </div>
      </div>

      <div className="hero-visual" aria-label="BiteMatch preview">
        <div className="custom-phone-mockup">
          <div className="custom-phone-side side-left" aria-hidden="true" />
          <div className="custom-phone-side side-right" aria-hidden="true" />
          <div className="custom-phone-screen">
            <div className="phone-system-status" aria-hidden="true">
              <span>9:41</span>
              <div>
                <i className="signal-bars" />
                <i className="lte-mark">LTE</i>
                <i className="battery-mark" />
              </div>
            </div>
            <div className="custom-phone-notch" aria-hidden="true" />
            <div className="phone-status">
              <span>Tonight&apos;s Picks</span>
              <strong>4 Friends</strong>
            </div>
            <div className="prototype-stage compact-prototype-stage" aria-label="Animated restaurant voting demo">
              {prototypeRestaurants.map((restaurant, index) => (
                <article
                  className={`phone-card prototype-card prototype-card-${index + 1}`}
                  key={restaurant.id}
                >
                  <DishArt restaurant={restaurant} priority={index === 0} sizes="220px" bob={false} />
                  <div className="swipe-stamp swipe-stamp-like">Like</div>
                  <div className="swipe-stamp swipe-stamp-pass">Pass</div>
                  <div className="phone-card-copy">
                    <span>
                      {restaurant.cuisine} · {restaurant.price}
                    </span>
                    <strong>{restaurant.name}</strong>
                    <small>
                      {restaurant.neighborhood} · {restaurant.distance} mi
                    </small>
                    <div className="profile-tags">
                      {restaurant.tags.slice(0, 2).map((tag) => (
                        <em key={tag}>{tag}</em>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="prototype-match-pop" aria-hidden="true">
              <span>
                <PartyPopper size={13} />
                It&apos;s a match
              </span>
              <strong>Tora Japanese</strong>
              <small>Everyone liked this one.</small>
            </div>
            <div className="phone-vote-row">
              <span aria-label="Pass">
                <X size={18} />
              </span>
              <span aria-label="Like">
                <Heart size={18} fill="currentColor" />
              </span>
            </div>
            <div className="prototype-progress" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="swipe-hint">Swipe, Skip &amp; Match on Dinner.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

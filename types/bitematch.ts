export type Cuisine =
  | "Italian"
  | "Japanese"
  | "Mexican"
  | "Thai"
  | "American"
  | "Mediterranean"
  | "Greek"
  | "Chinese"
  | "Korean"
  | "Indian";

export type PriceLevel = "$" | "$$" | "$$$";

export type Vote = "like" | "pass";

export type Preferences = {
  cuisines: Cuisine[];
  prices: PriceLevel[];
  maxDistance: number;
  /** Live rooms only: minutes until voting closes and the top pick wins. null or missing = no deadline. */
  deadlineMinutes?: number | null;
};

export type Participant = {
  id: string;
  name: string;
  color: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: Cuisine;
  price: PriceLevel;
  neighborhood: string;
  address: string;
  rating: number;
  /** Number of Google reviews behind the rating, when known. */
  reviewCount?: number;
  distance: number;
  image: string;
  menuImages: {
    src: string;
    alt: string;
    /** Photographer credit, required by Google for Places photos. */
    credit?: string;
    creditUrl?: string;
  }[];
  mapQuery: string;
  tags: string[];
  vibe: string;
  source?: "curated" | "google" | "osm";
};

export type VoteMap = Record<string, Record<string, Vote>>;

export type RestaurantSource = "curated" | "google" | "osm";

export type Cuisine =
  | "Italian"
  | "Japanese"
  | "Mexican"
  | "Thai"
  | "American"
  | "Mediterranean"
  | "Korean"
  | "Indian";

export type PriceLevel = "$" | "$$" | "$$$";

export type Vote = "like" | "pass";

export type Preferences = {
  cuisines: Cuisine[];
  prices: PriceLevel[];
  maxDistance: number;
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
  distance: number;
  image: string;
  menuImages: {
    src: string;
    alt: string;
  }[];
  mapQuery: string;
  tags: string[];
  vibe: string;
};

export type VoteMap = Record<string, Record<string, Vote>>;

import type { Restaurant } from "@/types/bitematch";

export const restaurants: Restaurant[] = [
  {
    id: "mida",
    name: "Mida",
    cuisine: "Italian",
    price: "$$",
    neighborhood: "South End",
    rating: 4.7,
    distance: 1.2,
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    tags: ["fresh pasta", "date-night energy", "shareable"],
    vibe: "Warm neighborhood Italian with plates that keep the table talking."
  },
  {
    id: "tora",
    name: "Tora Japanese",
    cuisine: "Japanese",
    price: "$$",
    neighborhood: "Chinatown",
    rating: 4.6,
    distance: 0.8,
    image:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80",
    tags: ["sushi", "quick walk", "light dinner"],
    vibe: "Low-friction sushi bowls and rolls for a group that wants easy yeses."
  },
  {
    id: "lolita",
    name: "Lolita Cocina",
    cuisine: "Mexican",
    price: "$$",
    neighborhood: "Back Bay",
    rating: 4.5,
    distance: 1.5,
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    tags: ["tacos", "margaritas", "late-night"],
    vibe: "Dim, lively, and built for friends who want dinner to turn into a night."
  },
  {
    id: "thai-dish",
    name: "Dakzen",
    cuisine: "Thai",
    price: "$",
    neighborhood: "Somerville",
    rating: 4.8,
    distance: 2.8,
    image:
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=1200&q=80",
    tags: ["noodles", "casual", "spicy"],
    vibe: "Fast, bright Thai street food when the group is hungry now."
  },
  {
    id: "buttermilk",
    name: "Buttermilk & Bourbon",
    cuisine: "American",
    price: "$$",
    neighborhood: "Back Bay",
    rating: 4.4,
    distance: 1.3,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    tags: ["comfort food", "small plates", "crowd-pleaser"],
    vibe: "Southern-inspired plates for groups that want crispy, cozy, and fun."
  },
  {
    id: "greco",
    name: "GRECO",
    cuisine: "Mediterranean",
    price: "$",
    neighborhood: "Seaport",
    rating: 4.6,
    distance: 1.9,
    image:
      "https://images.unsplash.com/photo-1542528180-a1208c5169a5?auto=format&fit=crop&w=1200&q=80",
    tags: ["pita", "quick bite", "fresh"],
    vibe: "Fast Mediterranean bowls and pita when nobody wants a big production."
  },
  {
    id: "kaju",
    name: "Kaju Tofu House",
    cuisine: "Korean",
    price: "$$",
    neighborhood: "Allston",
    rating: 4.7,
    distance: 3.2,
    image:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
    tags: ["tofu stew", "cozy", "hearty"],
    vibe: "Comforting Korean soups and sizzling plates for a colder-night consensus."
  },
  {
    id: "mela",
    name: "Mela",
    cuisine: "Indian",
    price: "$$",
    neighborhood: "South End",
    rating: 4.3,
    distance: 1.1,
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    tags: ["curry", "vegetarian-friendly", "group order"],
    vibe: "Classic Indian dishes with plenty of vegetarian-friendly shared options."
  }
];

export const cuisineOptions = [
  "Italian",
  "Japanese",
  "Mexican",
  "Thai",
  "American",
  "Mediterranean",
  "Korean",
  "Indian"
] as const;

export const priceOptions = ["$", "$$", "$$$"] as const;

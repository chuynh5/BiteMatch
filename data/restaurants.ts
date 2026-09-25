import type { Restaurant } from "@/types/bitematch";

export const restaurants: Restaurant[] = [
  {
    id: "mida",
    name: "Mida",
    cuisine: "Italian",
    price: "$$",
    neighborhood: "South End",
    address: "782 Tremont St, Boston, MA",
    rating: 4.7,
    distance: 1.2,
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=80",
        alt: "Fresh pasta on a white plate"
      },
      {
        src: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=700&q=80",
        alt: "Italian pasta with tomatoes and basil"
      },
      {
        src: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=700&q=80",
        alt: "Shared Italian dinner spread"
      }
    ],
    mapQuery: "Mida 782 Tremont St Boston MA",
    tags: ["fresh pasta", "date-night energy", "shareable"],
    vibe: "Warm neighborhood Italian with plates that keep the table talking."
  },
  {
    id: "tora",
    name: "Tora Japanese",
    cuisine: "Japanese",
    price: "$$",
    neighborhood: "Chinatown",
    address: "20B Tyler St, Boston, MA",
    rating: 4.6,
    distance: 0.8,
    image:
      "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=700&q=80",
        alt: "Assorted sushi rolls"
      },
      {
        src: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=700&q=80",
        alt: "Nigiri sushi selection"
      },
      {
        src: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?auto=format&fit=crop&w=700&q=80",
        alt: "Japanese rice bowl"
      }
    ],
    mapQuery: "Tora Japanese Restaurant 20B Tyler St Boston MA",
    tags: ["sushi", "quick walk", "light dinner"],
    vibe: "Low-friction sushi bowls and rolls for a group that wants easy yeses."
  },
  {
    id: "lolita",
    name: "Lolita Cocina",
    cuisine: "Mexican",
    price: "$$",
    neighborhood: "Back Bay",
    address: "271 Dartmouth St, Boston, MA",
    rating: 4.5,
    distance: 1.5,
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=700&q=80",
        alt: "Tacos with lime and salsa"
      },
      {
        src: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=700&q=80",
        alt: "Mexican dinner plates with dips"
      },
      {
        src: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=700&q=80",
        alt: "Grilled meat and sides"
      }
    ],
    mapQuery: "Lolita Cocina 271 Dartmouth St Boston MA",
    tags: ["tacos", "margaritas", "late-night"],
    vibe: "Dim, lively, and built for friends who want dinner to turn into a night."
  },
  {
    id: "thai-dish",
    name: "Dakzen",
    cuisine: "Thai",
    price: "$",
    neighborhood: "Somerville",
    address: "195 Elm St, Somerville, MA",
    rating: 4.8,
    distance: 2.8,
    image:
      "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=700&q=80",
        alt: "Thai noodle bowl with herbs"
      },
      {
        src: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=700&q=80",
        alt: "Spicy Thai curry"
      },
      {
        src: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80",
        alt: "Thai soup with vegetables"
      }
    ],
    mapQuery: "Dakzen 195 Elm St Somerville MA",
    tags: ["noodles", "casual", "spicy"],
    vibe: "Fast, bright Thai street food when the group is hungry now."
  },
  {
    id: "buttermilk",
    name: "Buttermilk & Bourbon",
    cuisine: "American",
    price: "$$",
    neighborhood: "Back Bay",
    address: "160 Commonwealth Ave, Boston, MA",
    rating: 4.4,
    distance: 1.3,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=700&q=80",
        alt: "Fried chicken with sides"
      },
      {
        src: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80",
        alt: "Burger and fries"
      },
      {
        src: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=700&q=80",
        alt: "Comfort food on shared plates"
      }
    ],
    mapQuery: "Buttermilk and Bourbon 160 Commonwealth Ave Boston MA",
    tags: ["comfort food", "small plates", "crowd-pleaser"],
    vibe: "Southern-inspired plates for groups that want crispy, cozy, and fun."
  },
  {
    id: "greco",
    name: "GRECO",
    cuisine: "Mediterranean",
    price: "$",
    neighborhood: "Seaport",
    address: "225 Northern Ave, Boston, MA",
    rating: 4.6,
    distance: 1.9,
    image:
      "https://images.unsplash.com/photo-1542528180-a1208c5169a5?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=700&q=80",
        alt: "Mediterranean pita with vegetables"
      },
      {
        src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80",
        alt: "Fresh Mediterranean salad"
      },
      {
        src: "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=700&q=80",
        alt: "Falafel and mezze platter"
      }
    ],
    mapQuery: "GRECO 225 Northern Ave Boston MA",
    tags: ["pita", "quick bite", "fresh"],
    vibe: "Fast Mediterranean bowls and pita when nobody wants a big production."
  },
  {
    id: "kaju",
    name: "Kaju Tofu House",
    cuisine: "Korean",
    price: "$$",
    neighborhood: "Allston",
    address: "58 Harvard Ave, Allston, MA",
    rating: 4.7,
    distance: 3.2,
    image:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1583224964978-2257b960c3d3?auto=format&fit=crop&w=700&q=80",
        alt: "Korean tofu stew"
      },
      {
        src: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=700&q=80",
        alt: "Korean shared dishes"
      },
      {
        src: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=700&q=80",
        alt: "Korean barbecue platter"
      }
    ],
    mapQuery: "Kaju Tofu House 58 Harvard Ave Allston MA",
    tags: ["tofu stew", "cozy", "hearty"],
    vibe: "Comforting Korean soups and sizzling plates for a colder-night consensus."
  },
  {
    id: "mela",
    name: "Mela",
    cuisine: "Indian",
    price: "$$",
    neighborhood: "South End",
    address: "578 Tremont St, Boston, MA",
    rating: 4.3,
    distance: 1.1,
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    menuImages: [
      {
        src: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
        alt: "Indian samosas with chutney"
      },
      {
        src: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=80",
        alt: "Indian curry with rice"
      },
      {
        src: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=80",
        alt: "Indian curry and naan"
      }
    ],
    mapQuery: "Mela 578 Tremont St Boston MA",
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

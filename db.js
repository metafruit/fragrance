const PRELOADED_FRAGRANCES = [
  {
    id: "bleu-de-chanel",
    name: "Bleu de Chanel",
    brand: "Chanel",
    concentration: "Eau de Parfum",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.9099.jpg",
    accords: [
      { name: "Citrus", value: 100, color: "#f1c40f" },
      { name: "Woody", value: 85, color: "#8e8e93" },
      { name: "Warm Spicy", value: 70, color: "#d35400" },
      { name: "Fresh Spicy", value: 65, color: "#2ecc71" },
      { name: "Amber", value: 60, color: "#e67e22" }
    ],
    seasons: { spring: 35, summer: 35, autumn: 20, winter: 10 },
    timeOfDay: { day: 65, night: 35 },
    notes: {
      top: ["Grapefruit", "Lemon", "Mint", "Pink Pepper", "Bergamot", "Aldehydes", "Coriander"],
      middle: ["Ginger", "Nutmeg", "Jasmine", "Melon"],
      base: ["Incense", "Amber", "Cedar", "Sandalwood", "Patchouli", "Labdanum", "Amberwood"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.1,
      distribution: { poor: 5, weak: 8, moderate: 30, long: 45, eternal: 12 }
    },
    sillage: {
      label: "Moderate",
      score: 3.5,
      distribution: { intimate: 12, moderate: 55, strong: 28, enormous: 5 }
    }
  },
  {
    id: "dior-sauvage",
    name: "Sauvage",
    brand: "Dior",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.31861.jpg",
    accords: [
      { name: "Fresh Spicy", value: 100, color: "#2ecc71" },
      { name: "Amber", value: 80, color: "#e67e22" },
      { name: "Citrus", value: 75, color: "#f1c40f" },
      { name: "Woody", value: 70, color: "#8e8e93" },
      { name: "Musky", value: 50, color: "#bdc3c7" }
    ],
    seasons: { spring: 30, summer: 35, autumn: 25, winter: 10 },
    timeOfDay: { day: 50, night: 50 },
    notes: {
      top: ["Calabrian Bergamot", "Pepper"],
      middle: ["Sichuan Pepper", "Lavender", "Pink Pepper", "Vetiver", "Patchouli", "Geranium", "Elemi"],
      base: ["Ambroxan", "Cedar", "Labdanum"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.2,
      distribution: { poor: 4, weak: 6, moderate: 28, long: 48, eternal: 14 }
    },
    sillage: {
      label: "Strong",
      score: 4.0,
      distribution: { intimate: 8, moderate: 32, strong: 50, enormous: 10 }
    }
  },
  {
    id: "creed-aventus",
    name: "Aventus",
    brand: "Creed",
    concentration: "Eau de Parfum",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.9803.jpg",
    accords: [
      { name: "Fruity", value: 100, color: "#e74c3c" },
      { name: "Woody", value: 80, color: "#8e8e93" },
      { name: "Sweet", value: 75, color: "#9b59b6" },
      { name: "Smoky", value: 70, color: "#34495e" },
      { name: "Leather", value: 50, color: "#795548" }
    ],
    seasons: { spring: 35, summer: 35, autumn: 25, winter: 5 },
    timeOfDay: { day: 70, night: 30 },
    notes: {
      top: ["Pineapple", "Bergamot", "Blackcurrant", "Apple"],
      middle: ["Birch", "Patchouli", "Moroccan Jasmine", "Rose"],
      base: ["Musk", "Oakmoss", "Ambergris", "Vanilla"]
    },
    longevity: {
      label: "Moderate",
      score: 3.8,
      distribution: { poor: 8, weak: 14, moderate: 38, long: 32, eternal: 8 }
    },
    sillage: {
      label: "Moderate",
      score: 3.6,
      distribution: { intimate: 10, moderate: 48, strong: 36, enormous: 6 }
    }
  },
  {
    id: "tf-tobacco-vanille",
    name: "Tobacco Vanille",
    brand: "Tom Ford",
    concentration: "Eau de Parfum",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.1825.jpg",
    accords: [
      { name: "Sweet", value: 100, color: "#9b59b6" },
      { name: "Tobacco", value: 95, color: "#795548" },
      { name: "Vanilla", value: 90, color: "#f5c518" },
      { name: "Warm Spicy", value: 85, color: "#d35400" },
      { name: "Powdery", value: 45, color: "#e7e7e7" }
    ],
    seasons: { spring: 5, summer: 2, autumn: 33, winter: 60 },
    timeOfDay: { day: 20, night: 80 },
    notes: {
      top: ["Tobacco Leaf", "Spicy Notes"],
      middle: ["Vanilla", "Cacao", "Tonka Bean", "Tobacco Blossom"],
      base: ["Dried Fruits", "Woody Notes"]
    },
    longevity: {
      label: "Eternal",
      score: 4.7,
      distribution: { poor: 2, weak: 3, moderate: 10, long: 35, eternal: 50 }
    },
    sillage: {
      label: "Strong",
      score: 4.3,
      distribution: { intimate: 4, moderate: 22, strong: 50, enormous: 24 }
    }
  },
  {
    id: "baccarat-rouge-540",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    concentration: "Eau de Parfum",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.37384.jpg",
    accords: [
      { name: "Amber", value: 100, color: "#e67e22" },
      { name: "Woody", value: 90, color: "#8e8e93" },
      { name: "Warm Spicy", value: 75, color: "#d35400" },
      { name: "Fresh Spicy", value: 50, color: "#2ecc71" },
      { name: "Aromatic", value: 40, color: "#1abc9c" }
    ],
    seasons: { spring: 20, summer: 15, autumn: 35, winter: 30 },
    timeOfDay: { day: 40, night: 60 },
    notes: {
      top: ["Saffron", "Jasmine"],
      middle: ["Amberwood", "Ambergris"],
      base: ["Fir Resin", "Cedar"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 5, weak: 7, moderate: 20, long: 43, eternal: 25 }
    },
    sillage: {
      label: "Strong",
      score: 4.2,
      distribution: { intimate: 6, moderate: 26, strong: 48, enormous: 20 }
    }
  },
  {
    id: "ysl-la-nuit-de-lhomme",
    name: "La Nuit de l'Homme",
    brand: "Yves Saint Laurent",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.5521.jpg",
    accords: [
      { name: "Aromatic", value: 100, color: "#1abc9c" },
      { name: "Warm Spicy", value: 95, color: "#d35400" },
      { name: "Woody", value: 70, color: "#8e8e93" },
      { name: "Lavender", value: 65, color: "#9b59b6" },
      { name: "Fresh Spicy", value: 50, color: "#2ecc71" }
    ],
    seasons: { spring: 20, summer: 5, autumn: 40, winter: 35 },
    timeOfDay: { day: 15, night: 85 },
    notes: {
      top: ["Cardamom"],
      middle: ["Lavender", "Virginia Cedar", "Bergamot"],
      base: ["Vetiver", "Caraway"]
    },
    longevity: {
      label: "Moderate",
      score: 3.4,
      distribution: { poor: 15, weak: 25, moderate: 40, long: 18, eternal: 2 }
    },
    sillage: {
      label: "Moderate",
      score: 3.2,
      distribution: { intimate: 28, moderate: 50, strong: 18, enormous: 4 }
    }
  },
  {
    id: "ysl-black-opium",
    name: "Black Opium",
    brand: "Yves Saint Laurent",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.25325.jpg",
    accords: [
      { name: "Vanilla", value: 100, color: "#f5c518" },
      { name: "Coffee", value: 85, color: "#6f4e37" },
      { name: "Sweet", value: 80, color: "#9b59b6" },
      { name: "Warm Spicy", value: 70, color: "#d35400" },
      { name: "White Floral", value: 60, color: "#ecf0f1" }
    ],
    seasons: { spring: 15, summer: 5, autumn: 40, winter: 40 },
    timeOfDay: { day: 25, night: 75 },
    notes: {
      top: ["Pear", "Pink Pepper", "Orange Blossom"],
      middle: ["Coffee", "Jasmine", "Bitter Almond", "Licorice"],
      base: ["Vanilla", "Patchouli", "Cashmere Wood", "Cedar"]
    },
    longevity: {
      label: "Long Lasting",
      score: 3.9,
      distribution: { poor: 6, weak: 10, moderate: 35, long: 40, eternal: 9 }
    },
    sillage: {
      label: "Moderate",
      score: 3.6,
      distribution: { intimate: 12, moderate: 48, strong: 32, enormous: 8 }
    }
  },
  {
    id: "acqua-di-gio",
    name: "Acqua di Gio",
    brand: "Giorgio Armani",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.410.jpg",
    accords: [
      { name: "Marine", value: 100, color: "#3498db" },
      { name: "Citrus", value: 90, color: "#f1c40f" },
      { name: "Aromatic", value: 80, color: "#1abc9c" },
      { name: "Fresh Spicy", value: 60, color: "#2ecc71" },
      { name: "Floral", value: 50, color: "#e84393" }
    ],
    seasons: { spring: 30, summer: 60, autumn: 8, winter: 2 },
    timeOfDay: { day: 80, night: 20 },
    notes: {
      top: ["Lime", "Lemon", "Bergamot", "Jasmine", "Orange", "Mandarin Orange", "Neroli"],
      middle: ["Sea Notes", "Jasmine", "Calone", "Rosemary", "Peach", "Freesia", "Honeysuckle", "Cyclamen", "Nutmeg", "Coriander", "Violet", "Rose"],
      base: ["White Musk", "Cedar", "Oakmoss", "Patchouli", "Amber"]
    },
    longevity: {
      label: "Moderate",
      score: 3.5,
      distribution: { poor: 8, weak: 18, moderate: 50, long: 22, eternal: 2 }
    },
    sillage: {
      label: "Moderate",
      score: 3.3,
      distribution: { intimate: 18, moderate: 55, strong: 24, enormous: 3 }
    }
  },
  {
    id: "chanel-no-5",
    name: "Chanel No 5",
    brand: "Chanel",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.608.jpg",
    accords: [
      { name: "Aldehydic", value: 100, color: "#e2e2e2" },
      { name: "Powdery", value: 90, color: "#e7e7e7" },
      { name: "Floral", value: 85, color: "#e84393" },
      { name: "Woody", value: 70, color: "#8e8e93" },
      { name: "Fresh", value: 60, color: "#55efc4" }
    ],
    seasons: { spring: 25, summer: 10, autumn: 30, winter: 35 },
    timeOfDay: { day: 45, night: 55 },
    notes: {
      top: ["Aldehydes", "Ylang-Ylang", "Neroli", "Bergamot", "Peach"],
      middle: ["Iris", "Jasmine", "Rose", "Orris Root", "Lily-of-the-Valley"],
      base: ["Sandalwood", "Amber", "Musk", "Vanilla", "Oakmoss", "Vetiver", "Patchouli"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.1,
      distribution: { poor: 4, weak: 8, moderate: 32, long: 44, eternal: 12 }
    },
    sillage: {
      label: "Strong",
      score: 3.9,
      distribution: { intimate: 10, moderate: 35, strong: 45, enormous: 10 }
    }
  },
  {
    id: "replica-by-the-fireplace",
    name: "By the Fireplace",
    brand: "Maison Margiela",
    concentration: "Eau de Toilette",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.31623.jpg",
    accords: [
      { name: "Woody", value: 100, color: "#8e8e93" },
      { name: "Sweet", value: 90, color: "#9b59b6" },
      { name: "Warm Spicy", value: 85, color: "#d35400" },
      { name: "Amber", value: 70, color: "#e67e22" },
      { name: "Balsamic", value: 55, color: "#d38b27" }
    ],
    seasons: { spring: 5, summer: 1, autumn: 34, winter: 60 },
    timeOfDay: { day: 15, night: 85 },
    notes: {
      top: ["Cloves", "Pink Pepper", "Orange Blossom"],
      middle: ["Chestnut", "Guaiac Wood", "Juniper"],
      base: ["Vanilla", "Peru Balsam", "Cashmeran"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.0,
      distribution: { poor: 4, weak: 8, moderate: 35, long: 43, eternal: 10 }
    },
    sillage: {
      label: "Moderate",
      score: 3.7,
      distribution: { intimate: 12, moderate: 45, strong: 35, enormous: 8 }
    }
  },
  {
    id: "coco-mademoiselle",
    name: "Coco Mademoiselle",
    brand: "Chanel",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.611.jpg",
    accords: [
      { name: "Citrus", value: 100, color: "#f1c40f" },
      { name: "Patchouli", value: 90, color: "#16a085" },
      { name: "Sweet", value: 80, color: "#9b59b6" },
      { name: "Floral", value: 75, color: "#e84393" },
      { name: "Rose", value: 65, color: "#fd79a8" }
    ],
    seasons: { spring: 40, summer: 15, autumn: 30, winter: 15 },
    timeOfDay: { day: 65, night: 35 },
    notes: {
      top: ["Orange", "Mandarin Orange", "Bergamot", "Orange Blossom"],
      middle: ["Turkish Rose", "Jasmine", "Mimosa", "Ylang-Ylang"],
      base: ["Patchouli", "White Musk", "Vanilla", "Vetiver", "Tonka Bean", "Opoponax"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 3, weak: 5, moderate: 22, long: 50, eternal: 20 }
    },
    sillage: {
      label: "Strong",
      score: 4.0,
      distribution: { intimate: 6, moderate: 34, strong: 48, enormous: 12 }
    }
  },
  {
    id: "le-labo-santal-33",
    name: "Santal 33",
    brand: "Le Labo",
    concentration: "Eau de Parfum",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.13190.jpg",
    accords: [
      { name: "Woody", value: 100, color: "#8e8e93" },
      { name: "Powdery", value: 85, color: "#e7e7e7" },
      { name: "Leather", value: 80, color: "#795548" },
      { name: "Warm Spicy", value: 60, color: "#d35400" },
      { name: "Aromatic", value: 50, color: "#1abc9c" }
    ],
    seasons: { spring: 25, summer: 10, autumn: 40, winter: 25 },
    timeOfDay: { day: 50, night: 50 },
    notes: {
      top: ["Cardamom", "Violet Accord"],
      middle: ["Iris", "Papyrus", "Ambrox"],
      base: ["Sandalwood", "Cedarwood", "Leather", "Musk"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.2,
      distribution: { poor: 4, weak: 6, moderate: 24, long: 48, eternal: 18 }
    },
    sillage: {
      label: "Strong",
      score: 4.1,
      distribution: { intimate: 8, moderate: 28, strong: 46, enormous: 18 }
    }
  },
  {
    id: "pdm-layton",
    name: "Layton",
    brand: "Parfums de Marly",
    concentration: "Eau de Parfum",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.40660.jpg",
    accords: [
      { name: "Warm Spicy", value: 100, color: "#d35400" },
      { name: "Vanilla", value: 95, color: "#f5c518" },
      { name: "Aromatic", value: 80, color: "#1abc9c" },
      { name: "Woody", value: 75, color: "#8e8e93" },
      { name: "Fresh Spicy", value: 70, color: "#2ecc71" }
    ],
    seasons: { spring: 20, summer: 5, autumn: 35, winter: 40 },
    timeOfDay: { day: 30, night: 70 },
    notes: {
      top: ["Apple", "Lavender", "Bergamot", "Mandarin Orange"],
      middle: ["Geranium", "Violet", "Jasmine"],
      base: ["Vanilla", "Cardamom", "Sandalwood", "Pepper", "Guaiac Wood", "Patchouli"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 3, weak: 5, moderate: 20, long: 52, eternal: 20 }
    },
    sillage: {
      label: "Strong",
      score: 4.0,
      distribution: { intimate: 6, moderate: 32, strong: 50, enormous: 12 }
    }
  },
  {
    id: "byredo-gypsy-water",
    name: "Gypsy Water",
    brand: "Byredo",
    concentration: "Eau de Parfum",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.3558.jpg",
    accords: [
      { name: "Woody", value: 100, color: "#8e8e93" },
      { name: "Aromatic", value: 85, color: "#1abc9c" },
      { name: "Citrus", value: 80, color: "#f1c40f" },
      { name: "Powdery", value: 60, color: "#e7e7e7" },
      { name: "Fresh Spicy", value: 50, color: "#2ecc71" }
    ],
    seasons: { spring: 35, summer: 35, autumn: 20, winter: 10 },
    timeOfDay: { day: 80, night: 20 },
    notes: {
      top: ["Juniper", "Lemon", "Bergamot", "Pepper"],
      middle: ["Pine Needles", "Incense", "Orris Root"],
      base: ["Sandalwood", "Vanilla", "Amber"]
    },
    longevity: {
      label: "Weak",
      score: 2.9,
      distribution: { poor: 28, weak: 35, moderate: 27, long: 9, eternal: 1 }
    },
    sillage: {
      label: "Intimate",
      score: 2.6,
      distribution: { intimate: 55, moderate: 35, strong: 8, enormous: 2 }
    }
  },
  {
    id: "flowerbomb",
    name: "Flowerbomb",
    brand: "Viktor & Rolf",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.1380.jpg",
    accords: [
      { name: "Floral", value: 100, color: "#e84393" },
      { name: "Patchouli", value: 85, color: "#16a085" },
      { name: "Sweet", value: 80, color: "#9b59b6" },
      { name: "Woody", value: 50, color: "#8e8e93" },
      { name: "Citrus", value: 40, color: "#f1c40f" }
    ],
    seasons: { spring: 30, summer: 10, autumn: 30, winter: 30 },
    timeOfDay: { day: 40, night: 60 },
    notes: {
      top: ["Tea", "Bergamot", "Osmanthus"],
      middle: ["Orchid", "Jasmine", "Rose", "Freesia", "African Orange Flower"],
      base: ["Patchouli", "Musk", "Vanilla"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.1,
      distribution: { poor: 4, weak: 8, moderate: 30, long: 46, eternal: 12 }
    },
    sillage: {
      label: "Strong",
      score: 3.9,
      distribution: { intimate: 8, moderate: 38, strong: 44, enormous: 10 }
    }
  },
  {
    id: "hermes-terre-dhermes",
    name: "Terre d'Hermes",
    brand: "Hermes",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.17.jpg",
    accords: [
      { name: "Citrus", value: 100, color: "#f1c40f" },
      { name: "Woody", value: 85, color: "#8e8e93" },
      { name: "Fresh Spicy", value: 75, color: "#2ecc71" },
      { name: "Earthy", value: 60, color: "#a0522d" }
    ],
    seasons: { spring: 45, summer: 20, autumn: 30, winter: 5 },
    timeOfDay: { day: 80, night: 20 },
    notes: {
      top: ["Orange", "Grapefruit"],
      middle: ["Flint", "Pepper", "Pink Pepper", "Geranium"],
      base: ["Woody Notes", "Cedar", "Vetiver", "Patchouli", "Benzoin"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.0,
      distribution: { poor: 3, weak: 7, moderate: 28, long: 50, eternal: 12 }
    },
    sillage: {
      label: "Moderate",
      score: 3.6,
      distribution: { intimate: 12, moderate: 54, strong: 28, enormous: 6 }
    }
  },
  {
    id: "dg-light-blue",
    name: "Light Blue Pour Homme",
    brand: "Dolce & Gabbana",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.1734.jpg",
    accords: [
      { name: "Citrus", value: 100, color: "#f1c40f" },
      { name: "Aromatic", value: 80, color: "#1abc9c" },
      { name: "Fresh Spicy", value: 70, color: "#2ecc71" },
      { name: "Marine", value: 65, color: "#3498db" }
    ],
    seasons: { spring: 25, summer: 70, autumn: 5, winter: 0 },
    timeOfDay: { day: 85, night: 15 },
    notes: {
      top: ["Grapefruit", "Bergamot", "Sicilian Mandarin", "Juniper"],
      middle: ["Pepper", "Rosewood", "Rosemary"],
      base: ["Musk", "Incense", "Oakmoss"]
    },
    longevity: {
      label: "Moderate",
      score: 3.2,
      distribution: { poor: 15, weak: 24, moderate: 45, long: 14, eternal: 2 }
    },
    sillage: {
      label: "Moderate",
      score: 3.1,
      distribution: { intimate: 22, moderate: 52, strong: 22, enormous: 4 }
    }
  },
  {
    id: "guerlain-shalimar",
    name: "Shalimar",
    brand: "Guerlain",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.53.jpg",
    accords: [
      { name: "Amber", value: 100, color: "#e67e22" },
      { name: "Citrus", value: 90, color: "#f1c40f" },
      { name: "Vanilla", value: 85, color: "#f5c518" },
      { name: "Powdery", value: 80, color: "#e7e7e7" },
      { name: "Smoky", value: 75, color: "#34495e" }
    ],
    seasons: { spring: 10, summer: 5, autumn: 35, winter: 50 },
    timeOfDay: { day: 25, night: 75 },
    notes: {
      top: ["Citruses", "Bergamot", "Lemon", "Cedar", "Mandarin Orange"],
      middle: ["Iris", "Patchouli", "Vetiver", "Jasmine", "Rose"],
      base: ["Vanilla", "Incense", "Leather", "Opoponax", "Civet", "Sandalwood", "Tonka Bean", "Musk"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.4,
      distribution: { poor: 3, weak: 5, moderate: 18, long: 44, eternal: 30 }
    },
    sillage: {
      label: "Strong",
      score: 4.2,
      distribution: { intimate: 6, moderate: 28, strong: 44, enormous: 22 }
    }
  },
  {
    id: "versace-eros",
    name: "Eros",
    brand: "Versace",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.16657.jpg",
    accords: [
      { name: "Vanilla", value: 100, color: "#f5c518" },
      { name: "Green", value: 85, color: "#2ecc71" },
      { name: "Sweet", value: 80, color: "#9b59b6" },
      { name: "Aromatic", value: 75, color: "#1abc9c" },
      { name: "Fresh Spicy", value: 60, color: "#2ecc71" }
    ],
    seasons: { spring: 25, summer: 15, autumn: 30, winter: 30 },
    timeOfDay: { day: 35, night: 65 },
    notes: {
      top: ["Mint", "Green Apple", "Lemon"],
      middle: ["Tonka Bean", "Ambroxan", "Geranium"],
      base: ["Madagascar Vanilla", "Virginian Cedar", "Atlas Cedar", "Vetiver", "Oakmoss"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 3, weak: 5, moderate: 20, long: 52, eternal: 20 }
    },
    sillage: {
      label: "Strong",
      score: 4.1,
      distribution: { intimate: 6, moderate: 24, strong: 50, enormous: 20 }
    }
  },
  {
    id: "replica-jazz-club",
    name: "Jazz Club",
    brand: "Maison Margiela",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.20541.jpg",
    accords: [
      { name: "Tobacco", value: 100, color: "#795548" },
      { name: "Sweet", value: 90, color: "#9b59b6" },
      { name: "Rum", value: 85, color: "#9e5c1d" },
      { name: "Woody", value: 80, color: "#8e8e93" },
      { name: "Warm Spicy", value: 75, color: "#d35400" }
    ],
    seasons: { spring: 5, summer: 2, autumn: 38, winter: 55 },
    timeOfDay: { day: 15, night: 85 },
    notes: {
      top: ["Pink Pepper", "Neroli", "Lemon"],
      middle: ["Rum", "Java Vetiver Oil", "Clary Sage"],
      base: ["Tobacco Leaf", "Vanilla Bean", "Styrax"]
    },
    longevity: {
      label: "Long Lasting",
      score: 3.9,
      distribution: { poor: 5, weak: 8, moderate: 32, long: 45, eternal: 10 }
    },
    sillage: {
      label: "Moderate",
      score: 3.6,
      distribution: { intimate: 12, moderate: 50, strong: 30, enormous: 8 }
    }
  },
  {
    id: "kilian-angels-share",
    name: "Angels' Share",
    brand: "Kilian",
    concentration: "Eau de Parfum",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.62677.jpg",
    accords: [
      { name: "Sweet", value: 100, color: "#9b59b6" },
      { name: "Warm Spicy", value: 95, color: "#d35400" },
      { name: "Woody", value: 80, color: "#8e8e93" },
      { name: "Amber", value: 70, color: "#e67e22" }
    ],
    seasons: { spring: 5, summer: 0, autumn: 35, winter: 60 },
    timeOfDay: { day: 15, night: 85 },
    notes: {
      top: ["Cognac"],
      middle: ["Cinnamon", "Tonka Bean", "Oak"],
      base: ["Praline", "Vanilla", "Sandalwood"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.4,
      distribution: { poor: 3, weak: 4, moderate: 15, long: 48, eternal: 30 }
    },
    sillage: {
      label: "Strong",
      score: 4.2,
      distribution: { intimate: 4, moderate: 22, strong: 52, enormous: 22 }
    }
  },
  {
    id: "jpg-ultra-male",
    name: "Ultra Male",
    brand: "Jean Paul Gaultier",
    concentration: "Eau de Toilette",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.30957.jpg",
    accords: [
      { name: "Sweet", value: 100, color: "#9b59b6" },
      { name: "Fruity", value: 90, color: "#e74c3c" },
      { name: "Vanilla", value: 85, color: "#f5c518" },
      { name: "Warm Spicy", value: 70, color: "#d35400" },
      { name: "Aromatic", value: 65, color: "#1abc9c" }
    ],
    seasons: { spring: 15, summer: 5, autumn: 40, winter: 40 },
    timeOfDay: { day: 20, night: 80 },
    notes: {
      top: ["Pear", "Lavender", "Mint", "Bergamot", "Lemon"],
      middle: ["Cinnamon", "Caraway", "Clary Sage"],
      base: ["Black Vanilla Husk", "Amber", "Patchouli", "Cedar"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 3, weak: 5, moderate: 20, long: 52, eternal: 20 }
    },
    sillage: {
      label: "Strong",
      score: 4.1,
      distribution: { intimate: 5, moderate: 25, strong: 50, enormous: 20 }
    }
  },
  {
    id: "dg-the-one-men",
    name: "The One for Men",
    brand: "Dolce & Gabbana",
    concentration: "Eau de Parfum",
    gender: "men",
    image: "https://fimgs.net/images/perfume/nd.31909.jpg",
    accords: [
      { name: "Amber", value: 100, color: "#e67e22" },
      { name: "Warm Spicy", value: 90, color: "#d35400" },
      { name: "Tobacco", value: 85, color: "#795548" },
      { name: "Citrus", value: 60, color: "#f1c40f" }
    ],
    seasons: { spring: 15, summer: 5, autumn: 40, winter: 40 },
    timeOfDay: { day: 25, night: 75 },
    notes: {
      top: ["Grapefruit", "Coriander", "Basil"],
      middle: ["Ginger", "Cardamom", "Orange Blossom"],
      base: ["Amber", "Tobacco", "Cedar"]
    },
    longevity: {
      label: "Moderate",
      score: 3.7,
      distribution: { poor: 8, weak: 14, moderate: 42, long: 30, eternal: 6 }
    },
    sillage: {
      label: "Moderate",
      score: 3.4,
      distribution: { intimate: 16, moderate: 54, strong: 26, enormous: 4 }
    }
  },
  {
    id: "replica-sailing-day",
    name: "Sailing Day",
    brand: "Maison Margiela",
    concentration: "Eau de Toilette",
    gender: "unisex",
    image: "https://fimgs.net/images/perfume/nd.46845.jpg",
    accords: [
      { name: "Marine", value: 100, color: "#3498db" },
      { name: "Aquatic", value: 90, color: "#3498db" },
      { name: "Fresh", value: 80, color: "#55efc4" },
      { name: "Ozonic", value: 75, color: "#a8e6cf" }
    ],
    seasons: { spring: 20, summer: 75, autumn: 5, winter: 0 },
    timeOfDay: { day: 90, night: 10 },
    notes: {
      top: ["Sea Notes", "Aldehydes", "Coriander", "Red Pepper"],
      middle: ["Juniper", "Iris", "Amyl Salicylate", "Rose"],
      base: ["Seaweed", "Cedar", "Amberwood", "Ambergris"]
    },
    longevity: {
      label: "Moderate",
      score: 3.3,
      distribution: { poor: 12, weak: 24, moderate: 46, long: 16, eternal: 2 }
    },
    sillage: {
      label: "Intimate",
      score: 2.8,
      distribution: { intimate: 48, moderate: 42, strong: 8, enormous: 2 }
    }
  },
  {
    id: "pdm-delina",
    name: "Delina",
    brand: "Parfums de Marly",
    concentration: "Eau de Parfum",
    gender: "women",
    image: "https://fimgs.net/images/perfume/nd.43871.jpg",
    accords: [
      { name: "Floral", value: 100, color: "#e84393" },
      { name: "Rose", value: 90, color: "#fd79a8" },
      { name: "Fruity", value: 85, color: "#e74c3c" },
      { name: "Fresh", value: 70, color: "#55efc4" },
      { name: "Sweet", value: 60, color: "#9b59b6" }
    ],
    seasons: { spring: 50, summer: 30, autumn: 15, winter: 5 },
    timeOfDay: { day: 70, night: 30 },
    notes: {
      top: ["Litchi", "Rhubarb", "Bergamot", "Nutmeg"],
      middle: ["Turkish Rose", "Peony", "Musk", "Petalia", "Vanilla"],
      base: ["Cashmeran", "Cedar", "Incense", "Haitian Vetiver"]
    },
    longevity: {
      label: "Long Lasting",
      score: 4.3,
      distribution: { poor: 3, weak: 5, moderate: 22, long: 50, eternal: 20 }
    },
    sillage: {
      label: "Strong",
      score: 4.1,
      distribution: { intimate: 6, moderate: 26, strong: 50, enormous: 18 }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRELOADED_FRAGRANCES };
}

const PLATFORMS = {
  PS5: { family: "ps", label: "band", mark: "ps5", logo: "/logos/playstation5.svg" },
  PS4: { family: "ps", label: "band", mark: "ps4", logo: "/logos/playstation4.svg" },
  PS3: { family: "ps", label: "band", mark: "ps3", logo: "/logos/playstation3.svg" },
  "Switch 2": { family: "switch", label: "corner", mark: "switch", logo: "/logos/switch.svg" },
  Switch: { family: "switch", label: "corner", mark: "switch", logo: "/logos/switch.svg" },
  "Series X|S": { family: "xbox", label: "corner", mark: "xbox-series", logo: "/logos/xbox.svg" },
  XONE: { family: "xbox", label: "band", mark: "xbox", logo: "/logos/xbox.svg" },
  X360: { family: "xbox", label: "band", mark: "xbox", logo: "/logos/xbox.svg" },
};

export function caseFor(platform) {
  return PLATFORMS[platform] || { family: "black", label: null, mark: null, logo: null };
}

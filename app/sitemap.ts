
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://wassce-prep-ashen.vercel.app";

  const pages = [
    "",
    "/about",
    "/contact",
    "/privacy",
  ];

  return pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: page === "" ? 1 : 0.5,
  }));
}

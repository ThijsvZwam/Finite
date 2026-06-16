import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`,
    {
      next: { revalidate: 1800 },
    },
  );
  const data = await res.json();

  if (data.status !== "ok") {
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 },
    );
  }

  // Filter sites
  const filteredArticles = data.articles
    .filter((article) => {
      const hasContent =
        article.title && article.description && article.urlToImage;

      const blacklist = [
        "wsj.com",
        "nytimes.com",
        "bloomberg.com",
        "barrons.com",
      ];
      const isCleanSource = !blacklist.some((domain) =>
        article.url.toLowerCase().includes(domain),
      );

      return hasContent && isCleanSource;
    })
    .slice(0, 3);

  return NextResponse.json(filteredArticles);
}

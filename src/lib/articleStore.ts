import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const DATA_PATH = resolve('data/articles.json');

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readTime: string;
  excerpt: string;
  content: string;
  heroImageUrl?: string;
  status: 'publish' | 'draft' | 'pending';
}

export function readArticles(): Article[] {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

export function upsertArticle(article: Article): void {
  const articles = readArticles();
  const idx = articles.findIndex(a => a.slug === article.slug);
  if (idx >= 0) {
    articles[idx] = article;
  } else {
    articles.unshift(article);
  }
  writeFileSync(DATA_PATH, JSON.stringify(articles, null, 2));
}

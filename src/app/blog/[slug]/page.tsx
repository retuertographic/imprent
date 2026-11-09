import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/sites/seritene/pages/Blog";
import { blogPosts, getBlogPost } from "@/components/sites/seritene/pages/blogPosts";
import { pageMetadata } from "@/components/sites/seritene/pages/meta";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const post = getBlogPost((await params).slug);
  return post ? pageMetadata(`/blog/${post.slug}/`, post.title, post.lead) : {};
}

export default async function Page({ params }: Props) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();
  return <BlogArticle post={post} />;
}

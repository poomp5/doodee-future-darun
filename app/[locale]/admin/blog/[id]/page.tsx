"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import BlogPostForm from "@/components/admin/blog/BlogPostForm";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/posts/${id}`);
        const data = await res.json();

        if (data.error) {
          console.error("Error fetching post:", data.error);
          router.push("/admin/blog");
          return;
        }

        setPost(data.data);
      } catch (error) {
        console.error("Error fetching post:", error);
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return <BlogPostForm postId={parseInt(id, 10)} initialData={post} />;
}

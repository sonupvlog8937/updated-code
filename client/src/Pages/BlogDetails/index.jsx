import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetchDataFromApi(`/api/blog/${id}`).then((res) => {
      setBlog(res?.blog || null);
    });
  }, [id]);

  if (!blog) {
    return (
      <section className="py-8 bg-white min-h-[60vh]">
        <div className="container">
          <p className="text-[15px] text-gray-600">Blog not found.</p>
          <Link to="/blog" className="link text-[14px] mt-3 inline-block">
            Back to Blogs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-white min-h-[60vh]">
      <div className="container max-w-[900px]">
        <h1 className="text-[28px] font-[700] leading-tight mb-3">{blog?.title}</h1>
        <p className="text-[13px] text-gray-500 mb-5">{blog?.createdAt?.split("T")[0]}</p>

        {blog?.images?.[0] && (
          <img
            src={blog?.images?.[0]}
            alt={blog?.title}
            className="w-full rounded-lg mb-6 object-cover"
          />
        )}

        <div
          className="text-[15px] leading-7 text-gray-800"
          dangerouslySetInnerHTML={{ __html: blog?.description }}
        />

        <Link to="/blog" className="link text-[14px] mt-8 inline-block">
          ← Back to Blogs
        </Link>
      </div>
    </section>
  );
};

export default BlogDetails;
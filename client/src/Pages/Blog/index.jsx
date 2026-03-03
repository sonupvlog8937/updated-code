import React, { useEffect, useState } from "react";
import BlogItem from "../../components/BlogItem";
import { fetchDataFromApi } from "../../utils/api";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchDataFromApi("/api/blog").then((res) => {
      setBlogs(res?.blogs || []);
    });
  }, []);

  return (
    <section className="py-6 bg-white min-h-[60vh]">
      <div className="container">
        <h1 className="text-[24px] font-[700] mb-5">Our Blogs</h1>

        {blogs?.length === 0 ? (
          <p className="text-[15px] text-gray-600">No blogs available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogs
              .slice()
              .reverse()
              .map((item) => (
                <BlogItem key={item?._id} item={item} />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
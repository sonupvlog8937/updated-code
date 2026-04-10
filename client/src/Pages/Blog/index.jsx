import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BlogItem from "../../components/BlogItem";
import { fetchDataFromApi } from "../../utils/api";
import { useDispatch } from "react-redux";
import { setGlobalLoading } from "../../store/appSlice";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Skeleton control ke liye
  const dispatch = useDispatch();

  useEffect(() => {
    // Page load hote hi top par push karein
    window.scrollTo(0, 0);

    // Global loading start karein (jo aapne App.jsx mein handle kiya hai)
    dispatch(setGlobalLoading(true));
    setIsLoading(true);

    fetchDataFromApi("/api/blog")
      .then((res) => {
        setBlogs(res?.blogs || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching blogs:", error);
        setIsLoading(false);
      })
      .finally(() => {
        // Data aane ke baad global loader band karein
        dispatch(setGlobalLoading(false));
      });
  }, [dispatch]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-10 bg-[#f8f9fa] min-h-screen"
    >
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-[800] text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Our Latest <span className="text-[#FF6B2B]">Blogs</span>
          </h1>
          <p className="text-gray-500 mt-2">Explore the latest updates and stories</p>
        </div>

        {/* ✅ LOGIC: Loading hai toh Skeleton dikhao, nahi toh Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 6 Skeleton Cards */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="w-full h-52 bg-gray-200 animate-pulse"></div> {/* Image skeleton */}
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse w-1/4 rounded"></div> {/* Category skeleton */}
                  <div className="h-6 bg-gray-200 animate-pulse w-full rounded"></div> {/* Title skeleton */}
                  <div className="h-4 bg-gray-200 animate-pulse w-3/4 rounded"></div> {/* Subtitle skeleton */}
                </div>
              </div>
            ))}
          </div>
        ) : blogs?.length === 0 ? (
          // Agar loading khatam ho gayi aur data nahi mila
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-700">No Blogs Found</h3>
            <p className="text-gray-400">Please check back later.</p>
          </div>
        ) : (
          // Jab data aa jaye
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {blogs.slice().reverse().map((item, index) => (
                <motion.div
                  key={item?._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BlogItem item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default Blog;
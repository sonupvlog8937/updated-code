import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaArrowRightLong, FaLayerGroup } from "react-icons/fa6";
import { useAppContext } from "../../hooks/useAppContext";

const CategoriesPage = () => {
  const { catData } = useAppContext();

  const categories = useMemo(() => catData || [], [catData]);

  return (
    <section className="bg-[#f8fafc] min-h-[70vh] py-8 lg:py-12">
      <div className="container">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-gray-900 rounded-2xl px-5 py-8 lg:px-10 lg:py-12 text-white mb-8 shadow-lg">
          <p className="uppercase tracking-[2px] text-xs lg:text-sm text-slate-300 mb-2">
            Discover Everything
          </p>
          <h1 className="text-2xl lg:text-4xl font-[700] leading-tight mb-3">
            Shop by Categories
          </h1>
          <p className="text-sm lg:text-base text-slate-200 max-w-2xl mb-5">
            Premium collections, hand-picked essentials, and trending picks —
            all arranged beautifully to help you navigate faster.
          </p>

          <Link
            to="/products"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-5 py-2.5 rounded-full font-[600] hover:shadow-md transition"
          >
            Explore All Products <FaArrowRightLong />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <FaLayerGroup className="mx-auto text-2xl text-slate-400 mb-2" />
            <h2 className="text-lg font-[600] text-slate-700 mb-1">
              Categories are loading...
            </h2>
            <p className="text-slate-500 text-sm">
              Please wait a moment while we fetch the latest collection map.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <article
                key={cat?._id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-lg font-[700] text-slate-800 capitalize">
                    {cat?.name}
                  </h2>
                  <span className="bg-slate-100 text-slate-700 text-xs font-[600] px-2.5 py-1 rounded-full">
                    {cat?.children?.length || 0} Subcategories
                  </span>
                </div>

                <div className="space-y-2 mb-4 min-h-[88px]">
                  {(cat?.children || []).slice(0, 4).map((subCat) => (
                    <Link
                      key={subCat?._id}
                      to={`/products?subCatId=${subCat?._id}`}
                      className="block text-sm text-slate-600 hover:text-[#ff5252] transition"
                    >
                      • {subCat?.name}
                    </Link>
                  ))}

                  {(!cat?.children || cat.children.length === 0) && (
                    <p className="text-sm text-slate-400">No subcategory listed yet.</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/products?catId=${cat?._id}`}
                    className="inline-flex items-center gap-2 text-sm font-[600] text-slate-900 hover:text-[#ff5252]"
                  >
                    View {cat?.name} <FaArrowRightLong className="text-xs" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesPage;
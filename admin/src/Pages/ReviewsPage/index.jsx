import { useContext, useEffect, useState } from "react";
import { Avatar, Card, CardContent, Chip, Divider, MenuItem, Pagination, Select, Skeleton } from "@mui/material";
import Rating from "@mui/material/Rating";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

const ReviewsPage = () => {
  const context = useContext(MyContext);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const isSeller = context?.userData?.role === "SELLER";

  const getReviews = async (currentPage, limit) => {
    setIsLoading(true);
    const res = await fetchDataFromApi(`/api/user/getAllReviews?page=${currentPage}&limit=${limit}`);

    if (res?.error === false) {
      setReviews(res?.reviews || []);
      setPagination(res?.pagination || { page: currentPage, limit, total: 0, totalPages: 0 });
    } else {
      setReviews([]);
      setPagination({ page: currentPage, limit, total: 0, totalPages: 0 });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (context?.userData?.role === "ADMIN" || context?.userData?.role === "SELLER") {
      getReviews(page, rowsPerPage);
    }
  }, [page, rowsPerPage, context?.userData?.role]);

  const title = isSeller ? "My Product Reviews" : "All Reviews";

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[22px] font-[700] text-slate-800">{title}</h2>
          <p className="text-[13px] text-slate-500">
            {isSeller
              ? "Only reviews related to your products are shown here."
              : "Centralized review management for all products."}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Chip size="small" label={`Total Reviews: ${pagination?.total || 0}`} className="!bg-indigo-50 !text-indigo-700 !font-[500]" />
            <Chip size="small" label={`Page ${page} of ${Math.max(pagination?.totalPages || 1, 1)}`} className="!bg-slate-100 !text-slate-700" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500">Rows:</span>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </div>
      </div>

      <Card className="!rounded-xl !border !border-slate-200 !shadow-sm">
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3">
              {[...Array(4)].map((_, idx) => (
                <Skeleton key={idx} variant="rounded" height={80} />
              ))}
            </div>
          ) : reviews?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-600 font-[500]">No reviews found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reviews.map((item) => (
                <div
                  key={item?._id}
                 className="border border-slate-200 rounded-lg p-3 md:p-4 bg-white flex flex-col md:flex-row md:items-start gap-3 hover:shadow-sm transition-shadow"
                >
                  <Avatar src={item?.image || ""} alt={item?.userName || "User"} />
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="text-[15px] font-[600] text-slate-800">{item?.userName || "Customer"}</h3>
                        <p className="text-[12px] text-slate-500">{item?.createdAt?.split("T")?.[0]}</p>
                      </div>
                      <Chip size="small" label={item?.productName || "Product"} className="!bg-slate-100 !text-slate-700" />
                    </div>

                    <div className="mt-2">
                      <Rating readOnly size="small" value={Number(item?.rating || 0)} />
                    </div>
                   <p className="text-[14px] text-slate-700 mt-2 leading-6">{item?.review}</p>
                    <Divider className="!my-3" />
                    <div className="flex items-center gap-2">
                      <Avatar variant="rounded" src={item?.productImage || ""} alt={item?.productName || "Product"} sx={{ width: 32, height: 32 }} />
                      <span className="text-[12px] text-slate-600">{item?.productName || "Product"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination?.totalPages > 1 && (
            <div className="mt-5 flex justify-end">
              <Pagination
                color="primary"
                page={page}
                count={pagination?.totalPages || 1}
                onChange={(_, newPage) => setPage(newPage)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsPage;
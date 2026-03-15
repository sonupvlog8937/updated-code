import React, { useContext, useEffect, useState } from 'react'
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useAppContext } from "../../hooks/useAppContext";
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';

export const Reviews = (props) => {

    const [reviews, setReviews] = useState({
        image: '',
        userName: '',
        review: '',
        rating: 1,
        userId: '',
        productId: ''
    });

    const [loading, setLoading] = useState(false);

    const [reviewsData, setReviewsData] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalReviews, setTotalReviews] = useState(0);

    const LIMIT = 5;

    const context = useAppContext();

    useEffect(() => {
        setReviews((prev) => ({
            ...prev,
            image: context?.userData?.avatar,
            userName: context?.userData?.name,
            userId: context?.userData?._id,
            productId: props?.productId
        }));

        // Reset and fetch fresh on productId change
        setReviewsData([]);
        setPage(1);
        setHasMore(false);
        fetchReviews(1, true);
    }, [context?.userData, props?.productId]);


    const onChangeInput = (e) => {
        setReviews((prev) => ({
            ...prev,
            review: e.target.value
        }));
    }

    // Fetch reviews from API
    // reset=true means replace list (fresh load), reset=false means append (load more)
    const fetchReviews = (pageNum = 1, reset = false) => {
        if (reset) {
            setLoadingMore(false);
        } else {
            setLoadingMore(true);
        }

        fetchDataFromApi(`/api/product/reviews/${props?.productId}?page=${pageNum}&limit=${LIMIT}`)
            .then((res) => {
                if (res?.error === false) {
                    setReviewsData((prev) => reset ? res.reviews : [...prev, ...res.reviews]);
                    setHasMore(res.hasMore);
                    setTotalReviews(res.total);
                    props.setReviewsCount(res.total);
                }
            })
            .finally(() => {
                setLoadingMore(false);
            });
    }

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReviews(nextPage, false);
    }

    const addReview = (e) => {
        e.preventDefault();

        if (reviews?.review !== "") {
            setLoading(true);
            postData("/api/user/addReview", reviews).then((res) => {
                if (res?.error === false) {
                    context.alertBox("success", res?.message);
                    setReviews((prev) => ({
                        ...prev,
                        review: '',
                        rating: 1
                    }));

                    setLoading(false);

                    // Reset list and fetch from page 1
                    setPage(1);
                    fetchReviews(1, true);

                } else {
                    context.alertBox("error", res?.message);
                    setLoading(false);
                }
            });
        } else {
            context.alertBox("error", "Please add review");
        }
    }

    return (
        <div className="w-full productReviewsContainer">
            <h2 className="text-[16px] lg:text-[18px]">Customer Reviews</h2>

            {
                reviewsData?.length !== 0 &&
                <div className="reviewScroll w-full max-h-full overflow-y-scroll overflow-x-hidden mt-5 pr-5">
                    {
                        reviewsData?.map((review, index) => {
                            return (
                                <div key={index} className="review pt-5 pb-5 border-b border-[rgba(0,0,0,0.1)] w-full flex items-center justify-between">
                                    <div className="info w-[80%] flex items-center gap-3">
                                        <div className="img w-[60px] h-[60px] overflow-hidden rounded-full">
                                            {
                                                review?.image !== "" && review?.image !== null ?
                                                    <img src={review?.image} className="w-full" />
                                                    :
                                                    <img src={"/user.jpg"} className="w-full" />
                                            }
                                        </div>

                                        <div className="w-[80%]">
                                            <h4 className="text-[16px]">{review?.userName}</h4>
                                            <h5 className="text-[13px] mb-0">{review?.createdAt?.split("T")[0]}</h5>
                                            <p className="mt-0 mb-0 text-[13px]">{review?.review}</p>
                                        </div>
                                    </div>

                                    <div className="">
                                        <Rating name="size-small" size="small" value={Number(review?.rating)} readOnly />
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            }

            {
                hasMore &&
                <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                        className='btn-org'
                        size="small"
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? <CircularProgress size={15} /> : `Load More (${totalReviews - reviewsData.length} remaining)`}
                    </Button>
                </div>
            }

            <br />

            <div className="reviewForm bg-[#fafafa] p-4 rounded-md">
                <h2 className="text-[18px]">Add a review</h2>

                <form className="w-full mt-5" onSubmit={addReview}>
                    <TextField
                        id="outlined-multiline-flexible"
                        label="Write a review..."
                        className="w-full"
                        onChange={onChangeInput}
                        name="review"
                        multiline
                        rows={5}
                        value={reviews.review}
                    />

                    <br />
                    <br />
                    <Rating name="size-small" value={reviews.rating} onChange={(event, newValue) => {
                        setReviews((prev) => ({
                            ...prev,
                            rating: newValue
                        }))
                    }} />

                    <div className="flex items-center mt-5">
                        <Button type="submit" className="btn-org flex gap-2">
                            {loading === true && <CircularProgress size={15} />}
                            Submit Review
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
import topSearchRepository from "../repositories/topSearch.repository.js";

export const incrementTopSearch = (keyword) => topSearchRepository.increment(keyword);

export const getTopSearches = async ({ period = "all", limit = 20 } = {}) => {
  switch (period) {
    case "today":
      return topSearchRepository.getTopToday(limit);
    case "week":
      return topSearchRepository.getTopWeek(limit);
    case "month":
      return topSearchRepository.getTopMonth(limit);
    default:
      return topSearchRepository.getTop(limit);
  }
};

export default { incrementTopSearch, getTopSearches };

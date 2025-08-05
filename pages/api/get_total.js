import { GetTotalResult } from "../../lib/get_total_result";

const GetTotal = async (req, res) => {
  const result = await GetTotalResult(req.query.use_different_personal_scores);
  res.json(result);
};

export default GetTotal;

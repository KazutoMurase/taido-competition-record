import { Set } from "../../lib/redis_client";

const ResetCache = async (req, res) => {
  try {
    const event_names = [
      "hokei_man",
      "hokei_woman",
      "zissen_man",
      "zissen_woman",
      "hokei_sonen",
      "hokei_newcommer",
      "hokei_kyuui_man",
      "hokei_kyuui_woman",
      "zissen_kyuui_man",
      "zissen_kyuui_woman",
    ];
    const block_names = ["block_a", "block_b", "block_c", "block_d"];
    // update timestamp to current
    const timestamp = Date.now();
    for (let i = 0; i < event_names.length; i++) {
      const event_name = event_names[i];
      await Set(
        "latest_update_result_for_" + event_name + "_timestamp",
        timestamp,
      );
    }
    for (let i = 0; i < block_names.length; i++) {
      const block_name = block_names[i];
      await Set("update_id_for_current_" + block_name, timestamp);
      await Set("update_game_id_for_current_" + block_name, timestamp);
      await Set("update_complete_players_for_" + block_name, timestamp);
    }
    await Set("latest_update_for_notification_request", timestamp);
    res.json([]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ResetCache;

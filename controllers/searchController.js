const Profile = require("../models/Profile");

exports.searchProfiles = async (req, res) => {
  try {
    let { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        status: "error",
        message: "Missing or empty parameter"
      });
    }

    q = q.toLowerCase();
    let filter = {};

    // Gender
    if (q.includes("male") && !q.includes("female")) filter.gender = "male";
    if (q.includes("female")) filter.gender = "female";
    if (q.includes("male and female")) delete filter.gender;

    // Age group
    ["child", "teenager", "adult", "senior"].forEach(g => {
      if (q.includes(g)) filter.age_group = g;
    });

    // Young
    if (q.includes("young")) {
      filter.age = { $gte: 16, $lte: 24 };
    }

    // Above / Below
    const above = q.match(/above (\d+)/);
    if (above) filter.age = { ...(filter.age || {}), $gte: Number(above[1]) };

    const below = q.match(/below (\d+)/);
    if (below) filter.age = { ...(filter.age || {}), $lte: Number(below[1]) };

    // Country
    const map = {
      nigeria: "NG",
      kenya: "KE",
      angola: "AO",
      ghana: "GH",
      uganda: "UG",
      tanzania: "TZ"
    };

    for (const key in map) {
      if (q.includes(key)) filter.country_id = map[key];
    }

    if (Object.keys(filter).length === 0) {
      return res.status(422).json({
        status: "error",
        message: "Unable to interpret query"
      });
    }

    page = Math.max(parseInt(page), 1);
    limit = Math.min(parseInt(limit) || 10, 50);

    const total = await Profile.countDocuments(filter);

    const data = await Profile.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      status: "success",
      page,
      limit,
      total,
      data
    });

  } catch {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};
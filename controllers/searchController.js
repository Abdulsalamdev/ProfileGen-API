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
    if (q.includes("male") && !q.includes("female")) {
      filter.gender = "male";
    }

    if (q.includes("female")) {
      filter.gender = "female";
    }

    if (q.includes("male and female")) {
      delete filter.gender;
    }

    // Age group
    ["child", "teenager", "adult", "senior"].forEach(group => {
      if (q.includes(group)) {
        filter.age_group = group;
      }
    });

    // Young logic
    if (q.includes("young")) {
      filter.age = { $gte: 16, $lte: 24 };
    }

    // Above / Below
    const above = q.match(/above (\d+)/);
    if (above) {
      filter.age = { ...(filter.age || {}), $gte: Number(above[1]) };
    }

    const below = q.match(/below (\d+)/);
    if (below) {
      filter.age = { ...(filter.age || {}), $lte: Number(below[1]) };
    }

    // Country map
    const countryMap = {
      nigeria: "NG",
      kenya: "KE",
      angola: "AO",
      ghana: "GH",
      uganda: "UG",
      tanzania: "TZ",
      usa: "US",
      "united states": "US",
      uk: "GB",
      "united kingdom": "GB"
    };

    Object.keys(countryMap).forEach(country => {
      if (q.includes(country)) {
        filter.country_id = countryMap[country];
      }
    });

    if (Object.keys(filter).length === 0) {
      return res.status(422).json({
        status: "error",
        message: "Unable to interpret query"
      });
    }

    page = parseInt(page);
    limit = Math.min(parseInt(limit), 50);

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

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};
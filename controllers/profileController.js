const Profile = require("../models/Profile");
const { v7: uuidv7 } = require("uuid");


function getAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}


exports.createProfile = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Missing or invalid name"
      });
    }

    name = name.toLowerCase().trim();

    const existing = await Profile.findOne({ name });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing
      });
    }

   

    const profile = await Profile.create({
      id: uuidv7(),
      name,
      gender: req.body.gender || "male",
      gender_probability: req.body.gender_probability || 1,
      age: req.body.age || 0,
      age_group: getAgeGroup(req.body.age || 0),
      country_id: (req.body.country_id || "NG").toUpperCase(),
      country_name: req.body.country_name || "Nigeria",
      country_probability: req.body.country_probability || 1,
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      status: "success",
      data: profile
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};


exports.getProfile = async (req, res) => {
  const profile = await Profile.findOne({ id: req.params.id });

  if (!profile) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found"
    });
  }

  return res.json({
    status: "success",
    data: profile
  });
};


exports.getAllProfiles = async (req, res) => {
  try {
    let {
      gender,
      country_id,
      age_group,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order = "asc",
      page = 1,
      limit = 10
    } = req.query;

    page = parseInt(page);
    limit = Math.min(parseInt(limit), 50);


    let filter = {};

    if (gender) filter.gender = gender.toLowerCase();
    if (country_id) filter.country_id = country_id.toUpperCase();
    if (age_group) filter.age_group = age_group.toLowerCase();

    if (min_age || max_age) {
      filter.age = {};
      if (min_age) filter.age.$gte = Number(min_age);
      if (max_age) filter.age.$lte = Number(max_age);
    }

    if (min_gender_probability) {
      filter.gender_probability = { $gte: Number(min_gender_probability) };
    }

    if (min_country_probability) {
      filter.country_probability = { $gte: Number(min_country_probability) };
    }

   
    const allowedSort = ["age", "created_at", "gender_probability"];

    let sort = {};
    if (sort_by) {
      if (!allowedSort.includes(sort_by)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid query parameters"
        });
      }

      sort[sort_by] = order === "desc" ? -1 : 1;
    } else {
      sort.created_at = -1;
    }

 
    const total = await Profile.countDocuments(filter);

    const data = await Profile.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      status: "success",
      page,
      limit,
      total,
      data
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};


exports.deleteProfile = async (req, res) => {
  const deleted = await Profile.findOneAndDelete({ id: req.params.id });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found"
    });
  }

  return res.status(204).send();
};


exports.searchProfiles = async (req, res) => {
  try {
    const q = req.query.q?.toLowerCase();

    if (!q) {
      return res.status(400).json({
        status: "error",
        message: "Missing query"
      });
    }

    let filter = {};

   
    if (q.includes("male")) filter.gender = "male";
    if (q.includes("female")) filter.gender = "female";

   
    if (q.includes("child")) filter.age_group = "child";
    if (q.includes("teen")) filter.age_group = "teenager";
    if (q.includes("adult")) filter.age_group = "adult";
    if (q.includes("senior")) filter.age_group = "senior";

    if (q.includes("young")) {
      filter.age = { $gte: 16, $lte: 24 };
    }

    if (q.includes("above")) {
      const match = q.match(/above (\d+)/);
      if (match) {
        filter.age = { $gte: Number(match[1]) };
      }
    }

   
    const countries = {
      nigeria: "NG",
      kenya: "KE",
      uganda: "UG",
      ghana: "GH",
      ethiopia: "ET",
      tanzania: "TZ",
      sudan: "SD",
      rwanda: "RW"
    };

    for (const [key, val] of Object.entries(countries)) {
      if (q.includes(key)) {
        filter.country_id = val;
      }
    }

   
    if (Object.keys(filter).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Unable to interpret query"
      });
    }

    const results = await Profile.find(filter);

    return res.json({
      status: "success",
      data: results
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};
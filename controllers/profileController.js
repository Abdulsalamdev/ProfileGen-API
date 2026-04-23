const axios = require("axios");
const Profile = require("../models/Profile");
const { v7: uuidv7 } = require("uuid")

// Helper: Age Group
function getAgeGroup(age) {
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}

exports.createProfile = async (req, res) => {
  try {
    let { name } = req.body;

    // Validate input
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Missing or invalid name"
      });
    }

    
    name = name.trim().toLowerCase();

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ name });

    if (existingProfile) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existingProfile
      });
    }

    // Call external APIs in parallel (faster)
    const [genderRes, ageRes, nationRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${name}`),
      axios.get(`https://api.agify.io?name=${name}`),
      axios.get(`https://api.nationalize.io?name=${name}`)
    ]);

    // Validate Genderize
    if (!genderRes.data.gender || genderRes.data.count === 0) {
      return res.status(502).json({
        status: "error",
        message: "Genderize returned an invalid response"
      });
    }

    // Validate Agify
    if (ageRes.data.age === null) {
      return res.status(502).json({
        status: "error",
        message: "Agify returned an invalid response"
      });
    }

    // Validate Nationalize
    if (
      !nationRes.data.country ||
      nationRes.data.country.length === 0
    ) {
      return res.status(502).json({
        status: "error",
        message: "Nationalize returned an invalid response"
      });
    }

    // Process Nationality (highest probability)
    const topCountry = nationRes.data.country.reduce((max, curr) =>
      curr.probability > max.probability ? curr : max
    );

    // Build profile object
    const newProfile = new Profile({
      id: uuidv7(),
      name,

      gender: genderRes.data.gender,
      gender_probability: genderRes.data.probability,
      sample_size: genderRes.data.count,

      age: ageRes.data.age,
      age_group: getAgeGroup(ageRes.data.age),

      country_id: topCountry.country_id,
      country_probability: topCountry.probability,

      created_at: new Date().toISOString()
    });

    
    await newProfile.save();

    
    return res.status(201).json({
      status: "success",
      data: newProfile
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({ id });

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(200).json({
      status: "success",
      data: profile
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};


exports.getAllProfiles = async (req, res) => {
  try {
    let {
      gender,
      age_group,
      country_id,
      min_age,
      max_age,
      min_gender_probability,
      min_country_probability,
      sort_by,
      order,
      page = 1,
      limit = 10
    } = req.query;

    // ✅ Normalize
    if (gender) gender = gender.toLowerCase();
    if (age_group) age_group = age_group.toLowerCase();
    if (country_id) country_id = country_id.toUpperCase();

    // ✅ Validation
    const isNumber = (v) => !isNaN(v);

    if (
      (min_age && !isNumber(min_age)) ||
      (max_age && !isNumber(max_age)) ||
      (min_gender_probability && !isNumber(min_gender_probability)) ||
      (min_country_probability && !isNumber(min_country_probability))
    ) {
      return res.status(422).json({
        status: "error",
        message: "Invalid query parameters"
      });
    }

    page = parseInt(page);
    limit = Math.min(parseInt(limit), 50);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    let filter = {};

    if (gender) filter.gender = gender;
    if (age_group) filter.age_group = age_group;
    if (country_id) filter.country_id = country_id;

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

    // ✅ Sorting
    let sort = {};
    const validSortFields = ["age", "created_at", "gender_probability"];
    const validOrder = ["asc", "desc"];

    if (sort_by) {
      if (!validSortFields.includes(sort_by)) {
        return res.status(422).json({
          status: "error",
          message: "Invalid query parameters"
        });
      }

      if (order && !validOrder.includes(order)) {
        return res.status(422).json({
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
      .limit(limit)
      .lean(); // ✅ performance boost

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
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOneAndDelete({ id });

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }

    return res.status(204).send(); 

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};
const axios = require("axios");
const Profile = require("../model/Profile");
const { v7: uuidv7 } = require("uuid");

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
    let { gender, country_id, age_group } = req.query;

    let filter = {};

    // Case-insensitive handling
    if (gender) {
      filter.gender = gender.toLowerCase();
    }

    if (country_id) {
      filter.country_id = country_id.toUpperCase();
    }

    if (age_group) {
      filter.age_group = age_group.toLowerCase();
    }

    const profiles = await Profile.find(filter);

    // Format response 
    const formatted = profiles.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      age: p.age,
      age_group: p.age_group,
      country_id: p.country_id
    }));

    return res.status(200).json({
      status: "success",
      count: formatted.length,
      data: formatted
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
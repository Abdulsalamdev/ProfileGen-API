const Profile = require("../models/Profile");
const { v7: uuidv7 } = require("uuid");
const { Parser } = require("json2csv");
const redisClient = require("../config/redis");
const normalizeFilter = require("../utils/normalizeFilter");
const fs = require("fs");
const csv = require("csv-parser");

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
        message: "Missing or invalid name",
      });
    }

    name = name.toLowerCase().trim();

    const existing = await Profile.findOne({ name });

    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: existing,
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
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      status: "success",
      data: profile,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

exports.getProfile = async (req, res) => {
  const profile = await Profile.findOne({ id: req.params.id });

  if (!profile) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  return res.json({
    status: "success",
    data: profile,
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
      limit = 10,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(parseInt(limit) || 10, 50);
    const skip = (page - 1) * limit;

    let filter = {};

    if (gender) filter.gender = gender.toLowerCase();
    if (country_id) filter.country_id = country_id.toUpperCase();
    if (age_group) filter.age_group = age_group.toLowerCase();

    if (min_age || max_age) {
      filter.age = {};
      if (min_age && isNaN(min_age)) {
        return res.status(422).json({ status: "error", message: "Invalid query parameters" });
      }
      if (max_age && isNaN(max_age)) {
        return res.status(422).json({ status: "error", message: "Invalid query parameters" });
      }
      if (min_age) filter.age.$gte = Number(min_age);
      if (max_age) filter.age.$lte = Number(max_age);
    }

    if (min_gender_probability) {
      if (isNaN(min_gender_probability)) {
        return res.status(422).json({ status: "error", message: "Invalid query parameters" });
      }
      filter.gender_probability = { $gte: Number(min_gender_probability) };
    }

    if (min_country_probability) {
      if (isNaN(min_country_probability)) {
        return res.status(422).json({ status: "error", message: "Invalid query parameters" });
      }
      filter.country_probability = { $gte: Number(min_country_probability) };
    }

    const allowedSort = ["age", "created_at", "gender_probability"];
    let sort = { created_at: -1 };

    if (sort_by) {
      if (!allowedSort.includes(sort_by)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid query parameters",
        });
      }
      sort = { [sort_by]: order === "desc" ? -1 : 1 };
    }

    // CACHE KEY
    const cacheKey =
      "profiles:" +
      normalizeFilter(filter, { sort_by, order, page, limit });

    // CHECK CACHE
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    //  DB QUERY
    const total = await Profile.countDocuments(filter);
    const data = await Profile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const response = {
      status: "success",
      page,
      limit,
      total,
      data,
    };

    // STORE CACHE
    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: 60,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

exports.deleteProfile = async (req, res) => {
  const deleted = await Profile.findOneAndDelete({ id: req.params.id });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      message: "Profile not found",
    });
  }

  return res.status(204).send();
};

exports.searchProfiles = async (req, res) => {
  try {
    const q = req.query.q?.toLowerCase();

    let page = Math.max(parseInt(req.query.page) || 1, 1);
    let limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        status: "error",
        message: "Missing query",
      });
    }

    let filter = {};

    if (q.includes("male") && q.includes("female")) {
    } else if (q.includes("male")) {
      filter.gender = "male";
    } else if (q.includes("female")) {
      filter.gender = "female";
    }

    if (q.includes("child")) filter.age_group = "child";
    if (q.includes("teen")) filter.age_group = "teenager";
    if (q.includes("adult")) filter.age_group = "adult";
    if (q.includes("senior")) filter.age_group = "senior";

    if (q.includes("young")) {
      filter.age = { $gte: 16, $lte: 24 };
    }

    const aboveMatch = q.match(/above (\d+)/);
    if (aboveMatch) {
      filter.age = { $gte: Number(aboveMatch[1]) };
    }

    const countries = {
      nigeria: "NG",
      kenya: "KE",
      angola: "AO",
      ghana: "GH",
    };

    for (const [key, val] of Object.entries(countries)) {
      if (q.includes(key)) filter.country_id = val;
    }

    if (Object.keys(filter).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Unable to interpret query",
      });
    }

    // 🔥 CACHE KEY
    const cacheKey =
      "search:" + normalizeFilter(filter, { page, limit });

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const total = await Profile.countDocuments(filter);
    const data = await Profile.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    const response = {
      status: "success",
      page,
      limit,
      total,
      data,
    };

    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: 60,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

exports.exportProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({}).lean(); // FIX

    if (!profiles.length) {
      return res.status(404).json({
        status: "error",
        message: "No profiles found",
      });
    }

    const fields = [
      "id",
      "name",
      "gender",
      "gender_probability",
      "age",
      "age_group",
      "country_id",
      "country_name",
      "country_probability",
      "created_at",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(profiles);

    res.header("Content-Type", "text/csv");
    res.attachment("profiles.csv");

    return res.send(csv);
  } catch (error) {
    console.error("CSV ERROR:", error); // 👈 add this
    return res.status(500).json({
      status: "error",
      message: "Failed to export CSV",
    });
  }
};

exports.uploadProfiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;

    const BATCH_SIZE = 1000;
    let batch = [];

    let stats = {
      total_rows: 0,
      inserted: 0,
      skipped: 0,
      reasons: {
        duplicate_name: 0,
        invalid_age: 0,
        missing_fields: 0,
        malformed: 0,
        invalid_gender: 0,
      },
    };

    // ✅ validation
    function validateRow(row) {
      if (!row.name || !row.age || !row.gender || !row.country_id) {
        stats.reasons.missing_fields++;
        return false;
      }

      if (isNaN(row.age) || Number(row.age) < 0) {
        stats.reasons.invalid_age++;
        return false;
      }

      if (!["male", "female"].includes(row.gender.toLowerCase())) {
        stats.reasons.invalid_gender++;
        return false;
      }

      return true;
    }

    // ✅ batch insert
    async function insertBatch(batch) {
      try {
        const docs = batch.map((row) => ({
          id: uuidv7(),
          name: row.name.toLowerCase().trim(),
          gender: row.gender.toLowerCase(),
          gender_probability: Number(row.gender_probability) || 1,
          age: Number(row.age),
          age_group: getAgeGroup(Number(row.age)),
          country_id: row.country_id.toUpperCase(),
          country_name: row.country_name || "Unknown",
          country_probability: Number(row.country_probability) || 1,
          created_at: new Date(),
        }));

        const result = await Profile.insertMany(docs, {
          ordered: false, // 🔥 allows partial success
        });

        stats.inserted += result.length;
      } catch (err) {
        if (err.writeErrors) {
          stats.skipped += err.writeErrors.length;
          stats.reasons.duplicate_name += err.writeErrors.length;
        } else {
          console.error("Batch error:", err);
        }
      }
    }

    // 🔥 sequential processing (safe for async)
    let processing = Promise.resolve();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        stats.total_rows++;

        processing = processing.then(async () => {
          try {
            if (!validateRow(row)) {
              stats.skipped++;
              return;
            }

            batch.push(row);

            if (batch.length >= BATCH_SIZE) {
              await insertBatch(batch);
              batch = [];
            }
          } catch (err) {
            stats.skipped++;
            stats.reasons.malformed++;
          }
        });
      })
      .on("end", async () => {
        await processing;

        if (batch.length) {
          await insertBatch(batch);
        }

        fs.unlinkSync(filePath); // cleanup

        return res.status(200).json({
          status: "success",
          ...stats,
        });
      })
      .on("error", (err) => {
        console.error(err);
        return res.status(500).json({
          status: "error",
          message: "CSV processing failed",
        });
      });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
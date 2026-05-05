function normalizeFilter(filter, options = {}) {
  return JSON.stringify({
    gender: filter.gender || null,
    country_id: filter.country_id || null,
    age_group: filter.age_group || null,
    min_age: filter.age?.$gte || null,
    max_age: filter.age?.$lte || null,
    min_gender_probability: filter.gender_probability?.$gte || null,
    min_country_probability: filter.country_probability?.$gte || null,
    sort_by: options.sort_by || "created_at",
    order: options.order || "desc",
    page: options.page || 1,
    limit: options.limit || 10,
  });
}

module.exports = normalizeFilter;
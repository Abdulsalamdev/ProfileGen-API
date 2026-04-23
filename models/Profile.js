const mongoose = require("mongoose")

const profileSchema =  new mongoose.Schema({
    id : {type: String, required: true, unique: true},
    name:  {type: String, required: true, unique: true},
    gender: String,
    gender_probability: Number,
   
    age: Number,
    age_group: String,

    country_id: String,
    country_name: String,
    
    country_probability: Number,
    created_at: String
})

module.exports = mongoose.model("Profile", profileSchema)

profileSchema.index({ gender: 1 });
profileSchema.index({ age: 1 });
profileSchema.index({ age_group: 1 });
profileSchema.index({ country_id: 1 });
profileSchema.index({ gender_probability: 1 });
profileSchema.index({ country_probability: 1 });
profileSchema.index({ created_at: -1 });
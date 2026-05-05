const multer = require("multer");
const path = require("path");

// store temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== ".csv") {
      return cb(new Error("Only CSV files allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;
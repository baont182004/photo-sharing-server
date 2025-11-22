import mongoose from "mongoose";

const shemaInfoSchema = new mongoose.Schema({
  version: { type: String, required: true },
  load_date_time: { type: Date, default: Date.now },
});

const SchemaInfo = mongoose.model("SchemaInfo", shemaInfoSchema);

export default SchemaInfo;
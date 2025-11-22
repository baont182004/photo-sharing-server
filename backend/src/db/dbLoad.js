// db/dbLoad.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import models from "../modelData/models.js";
import User from "./userModel.js";
import Photo from "./photoModel.js";
import SchemaInfo from "./schemaInfo.js";

dotenv.config();

const versionString = "1.0";

const dbLoad = async () => {
  // 1. Kết nối DB
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.error("Unable connecting to MongoDB Atlas!");
    console.error(error);
    process.exit(1);
  }

  // 2. Xóa dữ liệu cũ
  try {
    await Promise.all([
      User.deleteMany({}),
      Photo.deleteMany({}),
      SchemaInfo.deleteMany({}),
    ]);
    console.log("Cleared Users, Photos and SchemaInfo collections.");
  } catch (error) {
    console.error("Error clearing collections:", error);
    process.exit(1);
  }

  try {
    // 3. Tạo user mới từ dữ liệu mẫu
    const userModels = models.userListModel();
    const fakeIdToRealId = {};

    for (const user of userModels) {
      const userDoc = new User({
        first_name: user.first_name,
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation,
      });

      await userDoc.save();

      // lưu map ID giả -> ObjectId thực
      fakeIdToRealId[user._id] = userDoc._id;
      // gắn lại vào object để comment dùng chung reference
      user.objectID = userDoc._id;

      console.log(
        "Adding user:",
        `${user.first_name} ${user.last_name}`,
        "with ID",
        user.objectID.toString()
      );
    }

    // 4. Lấy tất cả photo từ modelData
    const photoModels = [];
    for (const fakeId of Object.keys(fakeIdToRealId)) {
      photoModels.push(...models.photoOfUserModel(fakeId));
    }

    // 5. Tạo Photo + comment
    for (const photo of photoModels) {
      const photoDoc = new Photo({
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: fakeIdToRealId[photo.user_id],
      });

      if (photo.comments && photo.comments.length > 0) {
        for (const comment of photo.comments) {
          photoDoc.comments.push({
            comment: comment.comment,
            date_time: comment.date_time,
            user_id: comment.user.objectID,
          });

          console.log(
            "Adding comment of length %d by user %s to photo %s",
            comment.comment.length,
            comment.user.objectID,
            photo.file_name
          );
        }
      }

      await photoDoc.save();
      console.log(
        "Adding photo:",
        photo.file_name,
        "of user ID",
        photoDoc.user_id.toString()
      );
    }

    // 6. Tạo SchemaInfo
    const schemaInfo = await SchemaInfo.create({
      version: versionString,
    });
    console.log("SchemaInfo object created with version", schemaInfo.version);
  } catch (error) {
    console.error("Error during dbLoad:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
};

export default dbLoad;

// Nếu chạy trực tiếp: node db/dbLoad.js
if (process.argv[1]?.includes("dbLoad.js")) {
  dbLoad();
}

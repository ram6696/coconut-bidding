const { model, Schema } = require("mongoose");
 
const UserComplaintsSchema = new Schema({
  complaint: {
    type: String,
    required: true
  },
  complaintBy: {
    type: String,
    required: true
  },
  complaintOn: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
});

module.exports = model("userComplaints", UserComplaintsSchema);

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
  productInfo: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true,
});

module.exports = model("userComplaints", UserComplaintsSchema);

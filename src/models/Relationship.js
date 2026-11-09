const mongoose = require("mongoose");

const relationshipObjectSchema = mongoose.Schema({
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["denied", "accepted", "pending"],
  },
});
const relationshipPersonSchema = mongoose.Schema({
  personId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },
  relationships: [relationshipObjectSchema],
});

relationshipPersonSchema.statics.findBetween = async function (userA, userB) {
  const docs = await this.find({
    $or: [
      { personId: userA, "relationships.friendId": userB },
      { personId: userB, "relationships.friendId": userA },
    ],
  });

  for (const doc of docs) {
    const otherId = doc.personId.equals(userA) ? userB : userA;
    const item = doc.relationships.find((relation) =>
      relation.friendId.equals(otherId),
    );

    if (item) {
      return { doc, item, requesterId: doc.personId, status: item.status };
    }
  }

  return null;
};

module.exports = mongoose.model("Relationship", relationshipPersonSchema);

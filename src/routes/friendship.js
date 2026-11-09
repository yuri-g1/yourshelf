const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Relationship = require("../models/Relationship");
const identifyUser = require("../middlewares/IdentifyUser");

const router = express.Router();

router.post("/friendship/:id", identifyUser, async (req, res) => {
  const me = req.user._id;
  const targetId = req.params.id;

  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (me.equals(targetId)) {
    return res
      .status(400)
      .json({ error: "You cannot send a friend request to yourself" });
  }

  if (!(await User.exists({ _id: targetId }))) {
    return res.status(404).json({ error: "User not found" });
  }

  const existing = await Relationship.findBetween(me, targetId);

  if (existing && existing.status !== "denied") {
    return res
      .status(409)
      .json({ error: `Relationship is already ${existing.status}` });
  }

  if (existing) {
    existing.item.deleteOne();
    await existing.doc.save();
  }

  await Relationship.updateOne(
    { personId: me },
    { $push: { relationships: { friendId: targetId } } },
    { upsert: true },
  );

  return res.status(201).json({ friendId: targetId, status: "pending" });
});

router.get("/friendship", identifyUser, async (req, res) => {
  const requests = await Relationship.find({
    relationships: {
      $elemMatch: { friendId: req.user._id, status: "pending" },
    },
  }).populate("personId", "name");

  return res.json(requests.map((doc) => ({ from: doc.personId })));
});

router.post("/update-relationship-state", identifyUser, async (req, res) => {
  const me = req.user._id;
  const otherId = req.body?.userId;
  const newState = req.body?.relationship_state;

  if (!["accepted", "denied"].includes(newState)) {
    return res
      .status(400)
      .json({ error: "relationship_state must be accepted or denied" });
  }

  if (!mongoose.isValidObjectId(otherId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const relation = await Relationship.findBetween(me, otherId);

  if (!relation) {
    return res.status(404).json({ error: "Relationship not found" });
  }

  const iAmReceiver = !relation.requesterId.equals(me);

  if (relation.status === "pending" && !iAmReceiver) {
    return res
      .status(403)
      .json({ error: "Only the receiver can answer a pending request" });
  }

  const allowed =
    relation.status === "pending" ||
    (relation.status === "accepted" && newState === "denied");

  if (!allowed) {
    return res.status(409).json({
      error: `Cannot change from ${relation.status} to ${newState}`,
    });
  }

  relation.item.status = newState;
  await relation.doc.save();

  return res.json({ userId: otherId, status: newState });
});

router.get("/relationships", identifyUser, async (req, res) => {
  const me = req.user._id;

  const sent = await Relationship.findOne({ personId: me }).populate(
    "relationships.friendId",
    "name",
  );
  const received = await Relationship.find({
    "relationships.friendId": me,
  }).populate("personId", "name");

  const sentList = (sent?.relationships ?? []).map((relation) => ({
    user: relation.friendId,
    status: relation.status,
    direction: "sent",
  }));

  const receivedList = received.map((doc) => {
    const relation = doc.relationships.find((item) =>
      item.friendId.equals(me),
    );
    return { user: doc.personId, status: relation.status, direction: "received" };
  });

  return res.json([...sentList, ...receivedList]);
});

module.exports = router;

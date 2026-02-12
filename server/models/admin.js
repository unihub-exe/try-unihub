const mongoose = require("mongoose");
const { eventSchema } = require("./event");

const adminSchema = new mongoose.Schema(
    {
        admin_id: {
            type: String,
            requird: true,
        },
        email: {
            type: String,
            unique: true,
        },
        pass: {
            type: String,
        },
        name: {
            type: String,
        },
        eventCreated: [],

        expireAt: {
            type: Date,
            default: Date.now,
            index: { expires: "2592000s" },
        },
    },
    { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

const test_credential = new Admin({
    admin_id: "hqwkufywealufyewf.weiugbfre654wegreg",
    email: "invite.testing@gmail.com",
    name: "test",
    pass: "invite123",
});

Admin.findOne({ admin_id: "hqwkufywealufyewf.weiugbfre654wegreg" })
  .then((doc) => {
    if (!doc) {
      test_credential.save()
        .then(() => console.log("Saved::Admin::test credentials", test_credential))
        .catch((err) => console.log(err));
    }
  })
  .catch((err) => console.log(err));

module.exports = Admin;

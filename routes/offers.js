const express = require("express");

const router = express.Router();

const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const Offer = require("../models/Offer");
const User = require("../models/User");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const convertedFile = convertToBase64(req.files.picture);

      // console.log(uploadResult);

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],

        owner: req.owner,
      });

      const uploadResult = await cloudinary.uploader.upload(convertedFile, {
        folder: `vinted/offers/${newOffer._id}`,
      });

      newOffer.product_image = uploadResult;

      //   console.log(newOffer);
      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", isAuthenticated, async (req, res) => {
  try {
    // console.log("query", req.query);
    let limit = 20;
    let skip = 0;

    const filters = {};

    if (req.query.title) {
      const regExp = new RegExp(req.query.title, "i");
      filters.product_name = regExp;
    }

    if (req.query.priceMin && req.query.priceMax) {
      filters.product_price = {
        $gte: req.query.priceMin,
        $lte: req.query.priceMax,
      };
    } else if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    } else if (req.query.priceMax) {
      filters.product_price = {
        $lte: req.query.priceMax,
      };
    }

    let sortType = {};

    if (req.query.sort === "price-asc") {
      sortType = { product_price: 1 };
    } else if (req.query.sort === "price-desc") {
      sortType = { product_price: -1 };
    }

    if (req.query.page) {
      limit = 5;
      skip = (req.query.page - 1) * limit;
    }

    // console.log(filters);

    const offers = await Offer.find(filters)
      .populate("owner", "account")
      .skip(skip)
      .limit(limit)
      .sort(sortType)
      .select();

    const result = await Offer.countDocuments(filters);
    // const count = result.length;

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

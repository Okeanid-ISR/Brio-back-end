import Restaurants from "../models/restaurants.js";
import {
  validateRestaurantComment,
  validateRestaurantLike,
} from "../validation/restaurantClientValidation.js";
import { UserClientModel } from "../models/userClient.js";
const restaurantController = {
  async getAllRestaurants(req, res) {
    try {
      let data = await Restaurants.find({});
      res.json(data);
    } catch (err) {
      console.log(err);
      return res.status(502).json({ err });
    }
  },

  async getRestaurantById(req, res) {
    let idParams = req.params.id;

    try {
      let data = await Restaurants.findById({ _id: idParams });
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ error: "Restaurant not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(502).json({ error: err });
    }
  },
  async getRestaurantProducts(req, res) {
    let idParams = req.params.id;

    try {
      let restaurant = await Restaurants.findById(idParams);
      if (restaurant) {
        let data = restaurant.products;
        res.json({ products: data });
      } else {
        res.status(404).json({ error: "Restaurant not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(502).json({ error: err });
    }
  },
  async removeProductFromRestaurant(req, res) {
    const { id } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ error: "No productId provided in the request body" });
    }

    try {
      const restaurant = await Restaurants.findById(id);
      if (restaurant) {
        const index = restaurant.products.findIndex(
          (prodId) => prodId.toString() === productId
        );

        if (index > -1) {
          restaurant.products.splice(index, 1);
        }

        const updatedRestaurant = await restaurant.save();

        res.status(200).json(updatedRestaurant);
      } else {
        res.status(404).json({ error: "Restaurant not found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
  },
  async addProductToRestaurant(req, res) {
    const { id } = req.params;
    const { productId } = req.body;

    try {
      const restaurant = await Restaurants.findById(id);
      if (restaurant) {
        // Add product id to restaurant's products array
        restaurant.products.push(productId);

        // Save the updated restaurant
        const updatedRestaurant = await restaurant.save();

        res.status(200).json(updatedRestaurant);
      } else {
        res.status(404).json({ error: "Restaurant not found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
  },

  async postUserComment(req, res) {
    const id = req.tokenData._id;

    if (!id) {
      return res.status(400).json({ error: "token id required" });
    }

    try {
      let user = await UserClientModel.findOne({ _id: id });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      let validBody = validateRestaurantComment(req.body);
      if (validBody.error) {
        return res.status(400).json(validBody.error.details);
      }

      let restaurant = await Restaurants.findOne({ _id: req.body.commentRef });
      if (!restaurant) {
        return res.status(401).json({ error: "Restaurant not found" });
      }
      let preBodyComment = req.body;
      preBodyComment.likes = [];
      preBodyComment.dislikes = [];
      preBodyComment.userRef = id;
      const savedReview = restaurant.reviews.create(preBodyComment);

      restaurant.reviews.push(savedReview);
      await restaurant.save();

      let userCommentBody = {
        commentRef: savedReview._id,
        restaurantRef: restaurant._id,
        datecreated: Date.now(),
      };

      user.comments.push(userCommentBody);
      await user.save();

      res.status(201).json({ msg: true });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: err });
    }
  },

  // Like a comment
  async postUserLike(req, res) {
    const userId = req.tokenData._id;
    const { commentId, restaurantId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "token id required" });
    }

    let validBody = validateRestaurantLike(req.body);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }

    try {
      let user = await UserClientModel.findOne({ _id: userId });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const restaurant = await Restaurants.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const comment = restaurant.reviews.find(
        (review) => review._id.toString() === commentId
      );
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const indexOfComment = comment.likes.indexOf(userId);
      if (indexOfComment === -1) {
        comment.likes.push(userId);
        // Remove user id from dislikes if it exists
        const dislikeIndex = comment.dislikes.indexOf(userId);
        if (dislikeIndex !== -1) comment.dislikes.splice(dislikeIndex, 1);
        res.status(200).send("The comment has been liked");
      } else {
        comment.likes.splice(indexOfComment, 1);
        res.status(200).send("The like has been removed");
      }

      await restaurant.save();
      // res.status(201).json({ msg: true });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  },

  // Dislike a comment
  async postUserDislike(req, res) {
    const userId = req.tokenData._id;
    const { commentId, restaurantId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "token id required" });
    }

    try {
      let user = await UserClientModel.findOne({ _id: userId });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const restaurant = await Restaurants.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const comment = restaurant.reviews.find(
        (review) => review._id.toString() === commentId
      );
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      const indexOfComment = comment.dislikes.indexOf(userId);
      if (indexOfComment === -1) {
        comment.dislikes.push(userId);
        // Remove user id from likes if it exists
        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex !== -1) comment.likes.splice(likeIndex, 1);
        res.status(200).send("The comment has been disliked");
      } else {
        comment.dislikes.splice(indexOfComment, 1);
        res.status(200).send("The dislike has been removed");
      }

      await restaurant.save();
      // res.status(201).json({ msg: true });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }
  },
};

export default restaurantController;

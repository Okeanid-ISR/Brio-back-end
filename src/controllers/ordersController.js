import { ordersModel } from "../models/orders.js";
import { productsModel } from "../models/products.js";
import promotionsModel from "../models/promotions.js";
import { UserClientModel } from "../models/userClient.js";
import {
  validateOrder,
  validateOrderStatus,
  validateUserOrder,
} from "../validation/ordersValidation.js";
const ordersController = {
  async getAllOrders(req, res) {
    try {
      let data = await ordersModel.find({});
      res.json(data);
    } catch (err) {
      console.log(err);
      return res.status(502).json({ err });
    }
  },

  async getUserOrders(req, res) {
    const id = req.tokenData._id;

    try {
      let data = await ordersModel.find({ userRef: id });
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ error: "Orders not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(502).json({ error: err });
    }
  },

  async getOrdersById(req, res) {
    let idParams = req.params.id;

    try {
      let data = await ordersModel.findById({ _id: idParams });
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (err) {
      console.log(err);
      res.status(502).json({ error: err });
    }
  },

  async postOrder(req, res) {
    const id = req.tokenData._id;

    const orderBody = req.body.checkoutBodyData;
    try {
      let user = await UserClientModel.findOne({ _id: id });
      if (!user) {
        return res.status(401).json({ err: "User not found" });
      }
      //validating order body
      let validBodyClient = validateUserOrder(orderBody);
      if (validBodyClient.error) {
        return res.status(400).json(validBodyClient.error.details);
      }
      console.log(orderBody.products);

      if (!user.cart) {
        return res.status(404).json({ error: "Cart data not found" });
      }
      //validating order summary (in case if user will modify it in client)
      let productsArr = [];
      let promotions = await promotionsModel.find({});

      let tempArr = [];
      // let tempArr2 = [];
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let dayName = days[new Date().getDay()];

      promotions.forEach((item) => {
        let startDate = new Date(item.startDate); // parse startDate into a Date object
        let endDate = new Date(item.endDate); // parse endDate into a Date object
        if (item.discountDays.includes(dayName) && new Date() < endDate) {
          let cleanItem = item.toObject();
          delete cleanItem.__v; // deletes the versionKey (__v) from the item, if not required
          tempArr.push(cleanItem);
        }
      });
      for (let item of user.cart) {
        console.log(item.productId);
        let product = await productsModel.findById(item.productId);
        if (product) {
          let promotion = tempArr.find((promo) =>
            promo.discountProducts.includes(item.productId)
          );

          console.log("promotion is " + promotion);
          if (promotion) {
            let discountPercentage = promotion.discountPercent;

            let discountedPrice =
              product.price * (1 - discountPercentage / 100);
            product.price = discountedPrice;
            console.log("promotion is " + discountPercentage);
            console.log("discounted price is " + discountedPrice);
          }

          product.price = product.price * item.productAmount;
          orderBody.ordersdata.products.map((item2, index) => {
            if (item2.productId === item.productId) {
              item2.priceItem = product.price;
              console.log("true");
              console.log(item2.priceItem);
            }
          });
          productsArr.push(product);
        } else {
          productsArr.push(null);
        }
      }

      let presummary = productsArr.reduce((total, item) => {
        return (total += item ? item.price : 0);
      }, 0);
      let shipping = 5; //TODO: REPLACE IN RESTAURANT SHIPPING AMOUNT
      let tips = orderBody.userdata.paymentSummary.tips;
      let setPayment = {
        tips: tips.toFixed(2),
        subtotal: presummary.toFixed(2),
        shipping: presummary > 0 ? shipping.toFixed(2) : 0,
        totalAmount: (shipping + presummary + tips).toFixed(2),
      };
      console.log(setPayment);
      if (!setPayment) {
        return res.status(502).json({ error: false });
      }
      // updating summary from server data
      orderBody.userdata.paymentSummary.tips = setPayment.tips;
      orderBody.userdata.paymentSummary.subtotal = setPayment.subtotal;
      orderBody.userdata.paymentSummary.shipping = setPayment.shipping;

      orderBody.userdata.paymentSummary.totalAmount = setPayment.totalAmount;
      let newOrder = await new ordersModel(orderBody);
      newOrder.userRef = id;
      await newOrder.save();
      console.log(newOrder);
      let newOrderUser = {
        userRef: newOrder.userRef,
        restaurant: newOrder.ordersdata.restaurants,
        creationDate: newOrder.creationDate,
        paymentSummary: newOrder.userdata.paymentSummary,
        orderRef: newOrder._id,
      };
      user.orders.push(newOrderUser);
      user.cart = [];
      await user.save();

      res.status(201).json({ msg: true });
    } catch (err) {
      console.log(err);
      return res.status(502).json({ err });
    }
  },

  async changeStatus(req, res) {
    const id = req.tokenData._id;
    if (!id) {
      res.status(200).json({ error: "token id required" });
    }

    try {
      let user = await UserClientModel.findOne({ _id: id });
      if (!user) {
        return res.status(401).json({ err: "User not found" });
      }

      let validBody = validateOrderStatus(req.body);
      if (validBody.error) {
        return res.status(400).json(validBody.error.details);
      }

      let orderId = req.body.orderId;

      let order = await ordersModel.findOne({ _id: orderId });
      console.log(req.body.orderId);
      console.log(order);
      console.log(req.body.orderId);
      console.log(req.body.orderstatus);

      if (!order) {
        return res.status(404).json("Cannot find order");
      }

      if (
        order.userdata.status != "Cancelled" ||
        order.userdata.status != "Delivered"
      ) {
        order.userdata.status = req.body.orderstatus;

        await order.save();
        res.status(200).json({ msg: true });
      }
    } catch (err) {
      console.log(err);
      res.status(502).json({ err });
    }
  },
};

export default ordersController;

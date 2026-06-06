import CartProductModel from "../models/cartProduct.modal.js";
import ProductModel from "../models/product.modal.js";

const getImageFromSelectedColor = (
  product = {},
  color = "",
  colorCode = "",
) => {
  const selectedColor = (product.colorOptions || []).find((option) => {
    const isNameMatch =
      color && option?.name?.toLowerCase() === color.toLowerCase();
    const isCodeMatch =
      colorCode && option?.code?.toLowerCase() === colorCode.toLowerCase();

    return isNameMatch || isCodeMatch;
  });

  if (selectedColor?.images?.length) {
    return selectedColor.images[0];
  }

  if (product?.images?.length) {
    return product.images[0];
  }

  return "";
};

export const addToCartItemController = async (request, response) => {
  try {
    const userId = request.userId; //middleware
    const {
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      quantity,
      subTotal,
      productId,
      countInStock,
      discount,
      size,
      weight,
      ram,
      brand,
      color,
      colorCode,
      selectedOptions,
    } = request.body;
    if (!productId) {
      return response.status(402).json({
        message: "Provide productId",
        error: true,
        success: false,
      });
    }

    const checkItemCart = await CartProductModel.findOne({
      userId: userId,
      productId: productId,
      size: size || null,
      weight: weight || null,
      ram: ram || null,
      color: color || "",
      selectedOptions: selectedOptions || {},
    });

    if (checkItemCart) {
      return response.status(400).json({
        message: "Item already in cart",
      });
    }

    const productDetails = await ProductModel.findById(productId).select(
      "images colorOptions",
    );
    const selectedImage =
      image || getImageFromSelectedColor(productDetails, color, colorCode);

    if (!selectedImage) {
      return response.status(400).json({
        message: "Product image not found",
        error: true,
        success: false,
      });
    }

    const cartItem = new CartProductModel({
      productTitle: productTitle,
      image: selectedImage,
      rating: rating,
      price: price,
      oldPrice: oldPrice,
      quantity: quantity,
      subTotal: subTotal,
      productId: productId,
      countInStock: countInStock,
      userId: userId,
      brand: brand,
      discount: discount,
      size: size,
      weight: weight,
      ram: ram,
      color: color,
      colorCode: colorCode,
      selectedOptions: selectedOptions || {},
    });

    const save = await cartItem.save();

    return response.status(200).json({
      data: save,
      message: "Item add successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const getCartItemController = async (request, response) => {
  try {
    const userId = request.userId;

    const cartItems = await CartProductModel.find({
      userId: userId,
    });

    return response.json({
      data: cartItems,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const updateCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id, qty, subTotal, size, weight, ram, color, colorCode, image } =
      request.body;

    if (!_id || !qty) {
      return response.status(400).json({
        message: "provide _id, qty",
      });
    }

    const existingCartItem = await CartProductModel.findOne({
      _id: _id,
      userId: userId,
    });

    if (!existingCartItem) {
      return response.status(404).json({
        message: "Cart item not found",
        error: true,
        success: false,
      });
    }

    const productDetails = await ProductModel.findById(
      existingCartItem.productId,
    ).select("images colorOptions");
    const resolvedImage =
      image ||
      getImageFromSelectedColor(productDetails, color, colorCode) ||
      existingCartItem.image;

    const updateCartitem = await CartProductModel.updateOne(
      {
        _id: _id,
        userId: userId,
      },
      {
        quantity: qty,
        subTotal: subTotal,
        size: size,
        ram: ram,
        weight: weight,
        color: color,
        colorCode: colorCode,
        image: resolvedImage,
      },
      { new: true },
    );

    return response.json({
      message: "Update cart item",
      success: true,
      error: false,
      data: updateCartitem,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const deleteCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId; // middleware
    const { id } = request.params;

    console.log("🗑️ Delete cart request - userId:", userId, "itemId:", id);
    console.log("📋 Request params:", request.params);
    console.log("📋 Request headers:", request.headers.authorization);

    if (!id) {
      console.log("❌ No ID provided");
      return response.status(400).json({
        message: "Provide _id",
        error: true,
        success: false,
      });
    }

    // Check if item exists first
    const existingItem = await CartProductModel.findOne({
      _id: id,
      userId: userId,
    });

    console.log("🔍 Existing item:", existingItem ? "Found" : "Not found");

    if (!existingItem) {
      return response.status(404).json({
        message: "The product in the cart is not found",
        error: true,
        success: false,
      });
    }

    const deleteCartItem = await CartProductModel.deleteOne({
      _id: id,
      userId: userId,
    });

    console.log("📦 Delete result:", deleteCartItem);

    if (deleteCartItem.deletedCount === 0) {
      return response.status(404).json({
        message: "The product in the cart could not be deleted",
        error: true,
        success: false,
      });
    }

    console.log("✅ Item deleted successfully");
    return response.status(200).json({
      message: "Item removed",
      error: false,
      success: true,
      data: deleteCartItem,
    });
  } catch (error) {
    console.error("❌ Delete cart error:", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const emptyCartController = async (request, response) => {
  try {
    const userId = request.params.id; // middlewar

    await CartProductModel.deleteMany({ userId: userId });

    return response.status(200).json({
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

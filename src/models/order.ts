import mongoose from "mongoose";

interface IOrder {
  topic: string;
  location: string;
  price: string;
  spaces: string;
}

const orderSchema = new mongoose.Schema<IOrder>({
  topic: { type: String, required: true },
  location: { type: String, required: true, unique: true },
  price: { type: String, required: true, unique: true },
  spaces: { type: String, required: true },
});

const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;

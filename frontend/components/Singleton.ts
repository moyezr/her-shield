import * as tf from "@tensorflow/tfjs";

const yamnetModel: { model: tf.GraphModel<string | tf.io.IOHandler> | null } = {
  model: null,
};

export { yamnetModel };

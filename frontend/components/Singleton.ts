import * as tf from "@tensorflow/tfjs";

let yamnetModel: { model: tf.GraphModel<string | tf.io.IOHandler> | null } = {
  model: null,
};

export { yamnetModel };

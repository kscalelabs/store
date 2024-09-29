class PPOModel {
  constructor() {
    this.session = null;
    this.inputName = "";
    this.outputName = "";
  }

  async loadModel(modelPath) {
    try {
      this.session = await ort.InferenceSession.create(modelPath);
      this.inputName = this.session.inputNames[0];
      this.outputName = this.session.outputNames[0];
      console.log("PPO model loaded successfully");
    } catch (error) {
      console.error("Error loading PPO model:", error);
    }
  }

  async predict(input) {
    if (!this.session) {
      console.error("Model not loaded. Call loadModel() first.");
      return null;
    }

    try {
      // Get the expected input shape from the model
      const inputTensor = new ort.Tensor("float32", new Float32Array(input), [
        1,
        input.length,
      ]);
      const feeds = {};
      feeds[this.inputName] = inputTensor;

      const outputMap = await this.session.run(feeds);
      const output = outputMap[this.outputName];

      return Array.from(output.data);
    } catch (error) {
      console.error("Error during prediction:", error);
      return null;
    }
  }
}

export default PPOModel;

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Load your model
model = tf.keras.models.load_model("mnist_model.h5")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        image_data = data['image']
        image_data = base64.b64decode(image_data.split(',')[1])
        img = Image.open(io.BytesIO(image_data)).convert('L').resize((28, 28))
        img = np.array(img)
        img = 255 - img
        img = img / 255.0
        img = img.reshape(1, 28, 28, 1)
        prediction = model.predict(img)
        digit = int(np.argmax(prediction))
        return jsonify({"prediction": digit})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
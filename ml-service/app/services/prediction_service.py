import os
import joblib
import pandas as pd
import numpy as np

# ==================================================
# EDUCATIONAL DOCUMENTATION
# ==================================================
# 1. What inference means: The process of feeding new, unseen live data into a pre-trained model to generate a prediction (output).
# 2. Difference between training and inference: Training calculates mathematical patterns over hours/days based on historic data. Inference is extremely fast (milliseconds), utilizing those locked patterns on a single new input.
# 3. Why the API loads the trained model instead of retraining: Retraining a model on every request would be impossibly slow and computationally expensive. We load the frozen .joblib file precisely because training is already finished.
# 4. Why feature order is important: The Random Forest natively processes arrays of numbers. If we swap Nitrogen (normally index 0) for Rainfall, the tree splits will be fundamentally confused, producing garbage outputs.
# 5. Why the LabelEncoder is required: The model spits out integer IDs (like 20). The LabelEncoder's `inverse_transform` reliably dictionary-maps that blind integer back into the human-readable string ("rice").
# 8. Why the prediction is a model output and not a guarantee of real-world crop success: This is exclusively the mathematical probability calculated under rigid synthetic constraints, not an agricultural guarantee incorporating weather events or market realities.

class PredictionService:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        
        # Absolute artifact paths resolving from this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
        self.model_path = os.path.join(project_root, 'artifacts', 'crop_random_forest.joblib')
        self.encoder_path = os.path.join(project_root, 'artifacts', 'crop_label_encoder.joblib')

    def load_artifacts(self):
        """Loads model and encoder strictly ONCE during startup to preserve latency."""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Missing model artifact at {self.model_path}")
            if not os.path.exists(self.encoder_path):
                raise FileNotFoundError(f"Missing encoder artifact at {self.encoder_path}")
                
            self.model = joblib.load(self.model_path)
            self.label_encoder = joblib.load(self.encoder_path)
            return True
        except Exception as e:
            # We raise here because the application cannot function without the model.
            raise RuntimeError(f"Failed to load ML artifacts: {str(e)}")

    def is_loaded(self) -> bool:
        return self.model is not None and self.label_encoder is not None

    def unload_artifacts(self):
        """Releases model and encoder references from memory during graceful shutdown."""
        self.model = None
        self.label_encoder = None

    def predict_crop(self, nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
        """Constructs vector, infers, decodes, and evaluates probability."""
        if not self.is_loaded():
            raise RuntimeError("ML Model forms are securely withheld as artifacts failed to load.")
            
        # 4. Canonical order strictly enforced directly inside a DataFrame
        # to ensure sklearn does not raise missing feature name warnings.
        features = pd.DataFrame([[
            nitrogen,
            phosphorus,
            potassium,
            temperature,
            humidity,
            ph,
            rainfall
        ]], columns=[
            "nitrogen",
            "phosphorus",
            "potassium",
            "temperature",
            "humidity",
            "pH",
            "rainfall"
        ])
        
        # 5. Label decoding and ranking
        probabilities = self.model.predict_proba(features)[0]
        
        # Get all class indices
        class_indices = self.model.classes_
        
        # Sort indices by probability descending
        sorted_indices = np.argsort(probabilities)[::-1]
        
        results = []
        for idx in sorted_indices:
            confidence = float(probabilities[idx])
            # Only include candidates with strictly positive probability
            if confidence <= 0.0:
                continue
            crop_name = self.label_encoder.inverse_transform([idx])[0]
            results.append({
                "rank": len(results) + 1,
                "crop": crop_name,
                "score": confidence
            })
            
        return results

prediction_service = PredictionService()

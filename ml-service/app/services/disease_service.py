import os
import json
import io
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

class DiseaseService:
    def __init__(self):
        self.model = None
        self.class_names_map = None
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
        self.model_path = os.path.join(project_root, 'artifacts', 'disease', 'disease_mobilenet_v3_small.pt')
        self.class_names_path = os.path.join(project_root, 'artifacts', 'disease', 'disease_class_names.json')
        
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        self.confidence_threshold = 0.70
        self.device = torch.device('cpu')

    def build_model(self, num_classes):
        model = models.mobilenet_v3_small(weights=None)
        num_ftrs = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(num_ftrs, num_classes)
        return model

    def load_artifacts(self):
        try:
            if not os.path.exists(self.class_names_path):
                raise FileNotFoundError(f"Missing class names artifact at {self.class_names_path}")
                
            with open(self.class_names_path, 'r') as f:
                self.class_names_map = json.load(f)
                
            num_classes = len(self.class_names_map)
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Missing model artifact at {self.model_path}")
                
            self.model = self.build_model(num_classes)
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device, weights_only=True))
            self.model.to(self.device)
            self.model.eval()
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to load Disease ML artifacts: {str(e)}")

    def is_loaded(self) -> bool:
        return self.model is not None and self.class_names_map is not None

    def unload_artifacts(self):
        """Releases PyTorch model and class mapping references from memory during graceful shutdown."""
        self.model = None
        self.class_names_map = None

    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Validate it's not simply a renamed text file by enforcing PIL load
            image.verify() 
            # Reopen because verify() consumes the file pointer
            image = Image.open(io.BytesIO(image_bytes))
            
            # Must convert to RGB cleanly if it's RGBA or Grayscale
            if image.mode != "RGB":
                image = image.convert("RGB")
                
            tensor = self.transform(image).unsqueeze(0)
            return tensor
        except Exception as e:
            raise ValueError(f"Invalid image content: {str(e)}")

    def predict_disease(self, image_bytes: bytes):
        if not self.is_loaded():
            raise RuntimeError("Disease ML Model is offline.")
            
        tensor = self.preprocess_image(image_bytes)
        tensor = tensor.to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            
        # Top-3 predictions
        top3_prob, top3_catid = torch.topk(probs, 3)
        
        top3_prob = top3_prob.numpy().tolist()
        top3_catid = top3_catid.numpy().tolist()
        
        # Primary prediction
        top1_prob = top3_prob[0]
        # class_names_map is usually "index (string)": "class_name"
        top1_class = self.class_names_map[str(top3_catid[0])]
        
        status = "confident" if top1_prob >= self.confidence_threshold else "uncertain"
        
        top3_results = []
        for i in range(3):
            top3_results.append({
                "rank": i + 1,
                "className": self.class_names_map[str(top3_catid[i])],
                "confidence": round(top3_prob[i], 4)
            })
            
        return {
            "prediction": {
                "className": top1_class,
                "confidence": round(top1_prob, 4),
                "status": status
            },
            "top3": top3_results
        }

disease_service = DiseaseService()

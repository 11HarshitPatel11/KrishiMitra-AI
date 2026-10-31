import os
import copy
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader

def train_model(data_dir, artifact_dir):
    print("Starting Model Training...")
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Setup data augmentations and preprocessing
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'validation': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    image_datasets = {
        x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
        for x in ['train', 'validation']
    }
    
    dataloaders = {
        x: DataLoader(image_datasets[x], batch_size=32, shuffle=True, num_workers=0)
        for x in ['train', 'validation']
    }
    
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'validation']}
    class_names = image_datasets['train'].classes
    num_classes = len(class_names)
    
    print(f"Classes: {class_names}")

    # Transfer Learning: Using MobileNetV3 Small (Lightweight)
    model = models.mobilenet_v3_small(weights='DEFAULT')
    
    # Freeze lower layers
    for param in model.parameters():
        param.requires_grad = False
        
    # Replace classification head
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    num_epochs = 5  # For real training, would be much higher with early stopping. Using 5 for practical evaluation limits here.
    
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0

    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

    for epoch in range(num_epochs):
        print(f"Epoch {epoch}/{num_epochs - 1}")
        print("-" * 10)

        for phase in ['train', 'validation']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f"{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")
            
            if phase == 'train':
                history['train_loss'].append(epoch_loss)
                history['train_acc'].append(epoch_acc.item())
            else:
                history['val_loss'].append(epoch_loss)
                history['val_acc'].append(epoch_acc.item())

            if phase == 'validation' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())

    print(f"Best Validation Accuracy: {best_acc:4f}")

    # Load best weights
    model.load_state_dict(best_model_wts)
    
    # Save Artifacts
    os.makedirs(artifact_dir, exist_ok=True)
    
    # Core model script
    torch.save(model.state_dict(), os.path.join(artifact_dir, "disease_model.pth"))
    
    # Class names map
    with open(os.path.join(artifact_dir, "disease_class_names.json"), 'w') as f:
        json.dump(class_names, f)
        
    # Metadata
    metadata = {
        "model_architecture": "MobileNetV3_Small",
        "input_size": [224, 224],
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "classes": num_classes,
        "best_val_accuracy": best_acc.item()
    }
    with open(os.path.join(artifact_dir, "disease_model_metadata.json"), 'w') as f:
        json.dump(metadata, f, indent=2)

    with open(os.path.join(artifact_dir, "disease_training_history.json"), 'w') as f:
        json.dump(history, f, indent=2)
        
    print("Training Complete. Artifacts saved successfully.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="../../datasets/disease")
    parser.add_argument("--artifact_dir", type=str, default="../../artifacts/disease")
    args = parser.parse_args()
    
    # Paths relative to training/disease script location fallback natively
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.data_dir))
    artifact_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.artifact_dir))
    
    train_model(data_path, artifact_path)

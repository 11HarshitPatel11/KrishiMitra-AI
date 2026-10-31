import os
import json
import torch
import torch.nn as nn
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import numpy as np

def evaluate_model(data_dir, artifact_dir):
    print("Evaluating Model on Test Set...")
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    
    # Load class names
    with open(os.path.join(artifact_dir, "disease_class_names.json"), 'r') as f:
        class_names = json.load(f)
        
    num_classes = len(class_names)
        
    # Rebuild architecture strictly
    model = models.mobilenet_v3_small(weights=None)
    num_ftrs = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(num_ftrs, num_classes)
    
    # Load weights
    model.load_state_dict(torch.load(os.path.join(artifact_dir, "disease_model.pth"), weights_only=True))
    model = model.to(device)
    model.eval()

    # Shared Test Pipeline Transformations
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    test_dataset = datasets.ImageFolder(os.path.join(data_dir, 'test'), transform)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)
    
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    # Standard metrics
    all_labels = np.array(all_labels)
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    
    eval_acc = accuracy_score(all_labels, all_preds)
    
    # Top-3 Accuracy
    top3_acc = 0.0
    if num_classes >= 3:
        top3_correct = 0
        for i in range(len(all_labels)):
            top3_classes = np.argsort(all_probs[i])[-3:]
            if all_labels[i] in top3_classes:
                top3_correct += 1
        top3_acc = top3_correct / len(all_labels)
    else:
        top3_acc = eval_acc # Degrade gracefully if subclasses < 3

    # Macro Evaluation using sk-learn seamlessly mapped to native reports
    report_dict = classification_report(all_labels, all_preds, target_names=class_names, output_dict=True, zero_division=0)
    conf_matrix = confusion_matrix(all_labels, all_preds)

    print(f"Test Accuracy: {eval_acc:.4f}")
    print(f"Top-3 Accuracy: {top3_acc:.4f}")
    print(f"Macro P: {report_dict['macro avg']['precision']:.4f} R: {report_dict['macro avg']['recall']:.4f} F1: {report_dict['macro avg']['f1-score']:.4f}")

    # Out of Distribution / Confidence Investigation
    # Determine the average confidence of correct vs incorrect predictions natively evaluating distribution limits
    correct_confidences = all_probs[all_labels == all_preds].max(axis=1)
    incorrect_confidences = all_probs[all_labels != all_preds].max(axis=1) if len(all_probs[all_labels != all_preds]) > 0 else np.array([0])
    
    avg_corr_conf = np.mean(correct_confidences) if len(correct_confidences) > 0 else 0
    avg_incorr_conf = np.mean(incorrect_confidences) if len(incorrect_confidences) > 0 else 0

    print(f"Avg Confidence (Correct): {avg_corr_conf:.4f}")
    print(f"Avg Confidence (Incorrect): {avg_incorr_conf:.4f}")
    
    # Calculate an optimal threshold logically derived identifying likely failures
    suggested_threshold = float(max(0.60, min(avg_corr_conf - 0.10, 0.90)))

    # Compile Evaluation Output cleanly
    evaluation_results = {
        "test_accuracy": float(eval_acc),
        "top3_accuracy": float(top3_acc),
        "macro_precision": float(report_dict['macro avg']['precision']),
        "macro_recall": float(report_dict['macro avg']['recall']),
        "macro_f1": float(report_dict['macro avg']['f1-score']),
        "confidence_threshold_suggested": suggested_threshold,
        "avg_confidence_correct": float(avg_corr_conf),
        "avg_confidence_incorrect": float(avg_incorr_conf)
    }

    # Save metrics
    with open(os.path.join(artifact_dir, "disease_classification_report.json"), 'w') as f:
        json.dump(report_dict, f, indent=2)
        
    with open(os.path.join(artifact_dir, "disease_evaluation_metrics.json"), 'w') as f:
        json.dump(evaluation_results, f, indent=2)
        
    np.save(os.path.join(artifact_dir, "disease_confusion_matrix.npy"), conf_matrix)
    
    # Single human-readable summary
    with open(os.path.join(artifact_dir, "disease_confusion_matrix.txt"), 'w') as f:
        f.write("Confusion Matrix:\n")
        f.write(np.array2string(conf_matrix))
        f.write("\n\nLabels Order: " + ", ".join(class_names))
        
    print("Evaluation Complete. Metrics securely stored in artifacts directory.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="../../datasets/disease")
    parser.add_argument("--artifact_dir", type=str, default="../../artifacts/disease")
    args = parser.parse_args()
    
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.data_dir))
    artifact_path = os.path.abspath(os.path.join(os.path.dirname(__file__), args.artifact_dir))
    
    evaluate_model(data_path, artifact_path)

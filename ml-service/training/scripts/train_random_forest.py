import os
import sys
import json
import joblib
from datetime import datetime
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from preprocess_dataset import preprocess_and_split

# ==================================================
# EDUCATIONAL DOCUMENTATION
# ==================================================
# 1. supervised learning: The model learns from labeled data. We provide both the input features (soil, weather) and the correct output (crop name) so it can learn the relationship.
# 2. classification: A type of supervised learning where the goal is to predict a category (like a crop name) rather than a continuous number (like price).
# 3. multiclass classification: Classification with more than two possible classes. Here, we must choose one correct crop out of 22 possibilities.
# 4. decision tree: A simple model that makes predictions by learning a series of if-then-else rules based on the features (e.g., if rainfall > 100 then...).
# 5. Random Forest: An ensemble learning method. It creates many different decision trees and lets them vote on the final prediction, reducing the risk of a bad guess.
# 6. ensemble learning: The technique of combining multiple models to create a single, more powerful and robust model.
# 7. n_estimators: The number of trees in our Random Forest. n_estimators=100 means 100 separate trees will vote.
# 8. random_state: A seed ensuring randomness (in building trees) is exactly identical every time the code runs for reproducibility.
# 9. training set: The chunk of data the model gets to see and learn from during `.fit()`.
# 10. test set: The chunk of data hidden from the model during training, used to grade its performance on unseen data.
# 11. overfitting: When a model memorizes training data but fails to generalize (high training accuracy, low test accuracy).
# 12. accuracy: The percentage of total predictions that were correct.
# 13. precision: When the model predicts a specific crop, how often is it right?
# 14. recall: Out of all the actual instances of a specific crop, how many did the model find?
# 15. F1-score: The harmonic mean of precision and recall. It balances the two metrics.
# 16. confusion matrix: A grid visualization plotting actual vs predicted classes, showing exactly which crops are mistaken for each other.
# 17. feature importance: A score showing how much the model relied on each feature for its learned decision process. (NOT causation!)
# 18. why feature scaling is not required for Random Forest: Tree-based models only care about ordering and split points, not absolute distances.
# 19. why test data must not be used for training: It would cause data leakage, falsely inflating accuracy because the model memorized the test answers.
# 20. why high test accuracy on this benchmark dataset does not automatically prove real-world agricultural accuracy: Real farm data is messy, noisy, and has variances not captured in clean datasets.

def main():
    print("==================================================")
    print("STEP 8: RANDOM FOREST MODEL TRAINING AND EVALUATION")
    print("==================================================\n")

    # Paths setup
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
    dataset_path = os.path.join(project_root, 'datasets', 'Crop_recommendation.csv')
    artifacts_dir = os.path.join(project_root, 'artifacts')
    outputs_dir = os.path.join(project_root, 'training', 'outputs')
    
    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)
    
    # 2. DATA SOURCE PREPARATION
    # Reusing the existing preprocessing pipeline.
    print("Loading data via preprocess_and_split...")
    X_train, X_test, y_train, y_test, class_mapping, le, column_map = preprocess_and_split(dataset_path)
    
    feature_names = list(X_train.columns)
    
    # 3. LABEL ENCODING MAPPING
    print("\n--- Crop Label Mapping ---")
    # Preserving and showing the crop <-> encoded-number mapping
    # Note: rice = 20 does NOT mean rice is "greater than" maize = 15. It's just a categorical ID.
    for encoded_id, crop_name in class_mapping.items():
        print(f"Class {encoded_id:2d} -> {crop_name}")

    # 4. TRAINING
    print("\n--- Training Random Forest Model ---")
    # Random Forest is a robust first baseline model that handles nonlinear data well without careful scaling.
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Model trained successfully.")
    print(f"Model Type: {type(model).__name__}")
    print(f"Number of trees (n_estimators): {model.n_estimators}")
    print(f"Training samples: {X_train.shape[0]}")
    print(f"Number of features: {X_train.shape[1]}")
    print(f"Number of classes: {len(class_mapping)}")
    print(f"Feature Names order: {feature_names}")
    
    # 5. PREDICTIONS
    print("\n--- Generating Predictions ---")
    # Generating on both to compare and check for overfitting
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    # 6. EVALUATION METRICS
    print("\n--- Evaluation Metrics ---")
    # A. Training Accuracy
    train_acc = accuracy_score(y_train, y_train_pred)
    # B. Test Accuracy
    test_acc = accuracy_score(y_test, y_test_pred)
    
    # C. Test Precision
    test_prec_macro = precision_score(y_test, y_test_pred, average='macro')
    test_prec_weighted = precision_score(y_test, y_test_pred, average='weighted')
    
    # D. Test Recall
    test_rec_macro = recall_score(y_test, y_test_pred, average='macro')
    test_rec_weighted = recall_score(y_test, y_test_pred, average='weighted')
    
    # E. Test F1-score
    test_f1_macro = f1_score(y_test, y_test_pred, average='macro')
    test_f1_weighted = f1_score(y_test, y_test_pred, average='weighted')
    
    print(f"Training Accuracy: {train_acc:.4f}")
    print(f"Test Accuracy:     {test_acc:.4f}")
    print(f"Test Precision (Macro):    {test_prec_macro:.4f} | (Weighted): {test_prec_weighted:.4f}")
    print(f"Test Recall (Macro):       {test_rec_macro:.4f} | (Weighted): {test_rec_weighted:.4f}")
    print(f"Test F1-score (Macro):     {test_f1_macro:.4f} | (Weighted): {test_f1_weighted:.4f}")
    
    # 10. OVERFITTING CHECK
    print("\n--- Overfitting Check ---")
    if train_acc - test_acc > 0.05:
        print("ALERT: Training accuracy is substantially higher than test accuracy, indicating possible overfitting.")
    else:
        print("Training and test accuracies are close. This indicates a small performance gap nicely, but does NOT automatically guarantee flawless real-world agricultural generalizability.")
    
    # 7. CONFUSION MATRIX
    print("\n--- Generating Confusion Matrix ---")
    cm = confusion_matrix(y_test, y_test_pred)
    crop_names = [class_mapping[i] for i in range(len(class_mapping))]
    
    plt.figure(figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=crop_names, yticklabels=crop_names)
    plt.title('Confusion Matrix - Actual vs Predicted Crops', fontsize=16)
    plt.ylabel('Actual Crops', fontsize=12)
    plt.xlabel('Predicted Crops', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    cm_path = os.path.join(outputs_dir, 'confusion_matrix.png')
    plt.savefig(cm_path)
    plt.close()
    print(f"Confusion matrix visualization saved to: {cm_path}")
    
    # 8. CLASSIFICATION REPORT
    print("\n--- Classification Report ---")
    report_str = classification_report(y_test, y_test_pred, target_names=crop_names)
    print(report_str)
    
    report_path = os.path.join(outputs_dir, 'classification_report.txt')
    with open(report_path, 'w') as f:
        f.write("Classification Report - Random Forest Baseline\n\n")
        f.write(report_str)
    print(f"Classification report saved to: {report_path}")
    
    # 9. FEATURE IMPORTANCE
    print("\n--- Feature Importance ---")
    importances = model.feature_importances_
    
    print("Importance values (Note: Does NOT imply causation):")
    for name, imp in zip(feature_names, importances):
        print(f" - {name:15s}: {imp:.4f}")
        
    # Visualization of feature importance
    indices = np.argsort(importances)[::-1]
    sorted_features = [feature_names[i] for i in indices]
    sorted_importances = importances[indices]
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x=sorted_importances, y=sorted_features, palette="viridis")
    plt.title('Feature Importances - Random Forest (Not Causation)', fontsize=14)
    plt.xlabel('Relative Predictive Importance')
    plt.ylabel('Features')
    plt.tight_layout()
    fi_path = os.path.join(outputs_dir, 'feature_importance.png')
    plt.savefig(fi_path)
    plt.close()
    print(f"Feature importance visualization saved to: {fi_path}")

    # 11. MODEL ARTIFACT
    print("\n--- Saving Model Artifacts ---")
    model_artifact_path = os.path.join(artifacts_dir, 'crop_random_forest.joblib')
    encoder_artifact_path = os.path.join(artifacts_dir, 'crop_label_encoder.joblib')
    metadata_artifact_path = os.path.join(artifacts_dir, 'model_metadata.json')
    
    joblib.dump(model, model_artifact_path)
    joblib.dump(le, encoder_artifact_path)
    
    # Save metadata
    metadata = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "random_state": 42,
        "feature_order": feature_names,
        "number_of_classes": len(class_mapping),
        "class_mapping": class_mapping,
        "training_date": datetime.now().isoformat(),
        "dataset_filename": "Crop_recommendation.csv",
        "metrics": {
            "training_accuracy": train_acc,
            "test_accuracy": test_acc,
            "test_macro_f1": test_f1_macro
        }
    }
    
    with open(metadata_artifact_path, 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Model saved to:       {model_artifact_path}")
    print(f"Label Encoder saved to: {encoder_artifact_path}")
    print(f"Metadata saved to:    {metadata_artifact_path}")
    print("\n[SUCCESS] Baseline Random Forest model training complete.")

if __name__ == "__main__":
    main()
